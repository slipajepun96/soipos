<?php

namespace App\Http\Controllers;

use App\Support\StoreRule;
use App\Models\Preorder;
use App\Models\PreorderSession;
use App\Models\Product;
use App\Models\SalesEvent;
use App\Models\Setting;
use App\Services\PreorderService;
use App\Services\StockLedger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PreorderSessionController extends Controller
{
    public function __construct(private PreorderService $preorders, private StockLedger $ledger)
    {
    }

    public function index()
    {
        $sessions = PreorderSession::withCount([
            'orders as orders_count' => fn ($q) => $q->where('status', '!=', 'cancelled'),
            'orders as pending_count' => fn ($q) => $q->where('status', 'pending'),
            'orders as collected_count' => fn ($q) => $q->where('status', 'collected'),
            'items',
        ])
            ->withSum(['orders as orders_total' => fn ($q) => $q->where('status', '!=', 'cancelled')], 'total')
            ->orderByRaw("status = 'open' desc")
            ->orderByDesc('pickup_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($s) => $s->toArray() + [
                'public_url' => $s->publicUrl(),
                'accepting' => $s->status === 'open' && $s->items_count > 0
                    && ($s->closes_at === null || $s->closes_at->isFuture()),
            ]);

        return Inertia::render('Preorders/SessionsIndex', ['sessions' => $sessions]);
    }

    public function create()
    {
        return Inertia::render('Preorders/SessionForm', $this->formProps(null));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateSession($request);

        $session = DB::transaction(function () use ($validated) {
            $session = PreorderSession::create($this->sessionFields($validated) + [
                'status' => 'open',
                'created_by' => Auth::user()?->name,
            ]);
            $this->syncItems($session, $validated['items']);

            return $session;
        });

        return redirect()->route('preorders.show', $session)->with([
            'type' => 'success',
            'message' => 'Pre-order session created. Share the public link with your customers.',
        ]);
    }

    public function edit(PreorderSession $session)
    {
        return Inertia::render('Preorders/SessionForm', $this->formProps($session));
    }

    public function update(Request $request, PreorderSession $session): RedirectResponse
    {
        $validated = $this->validateSession($request);

        DB::transaction(function () use ($session, $validated) {
            $session->update($this->sessionFields($validated));
            $this->syncItems($session, $validated['items']);
        });

        return redirect()->route('preorders.show', $session)->with(['type' => 'success', 'message' => 'Pre-order session saved.']);
    }

    /** Orders and packing summary for one session. */
    public function show(PreorderSession $session)
    {
        $session->load('items.product:id,product_name,product_unit,product_num_of_measure', 'event:id,name,status');

        $orders = $session->orders()
            ->with('lines', 'sale:id,receipt_no')
            ->orderByRaw("FIELD(status, 'pending', 'collected', 'cancelled')")
            ->orderBy('created_at')
            ->get();

        $active = $orders->where('status', '!=', 'cancelled');

        return Inertia::render('Preorders/SessionShow', [
            'session' => $session->toArray() + [
                'public_url' => $session->publicUrl(),
                'accepting' => $session->acceptingOrders(),
            ],
            'orders' => $orders->values(),
            'summary' => $this->preorders->packingSummary($session, $this->ledger->availableMap()),
            'stats' => [
                'orders' => $active->count(),
                'pending' => $orders->where('status', 'pending')->count(),
                'collected' => $orders->where('status', 'collected')->count(),
                'cancelled' => $orders->where('status', 'cancelled')->count(),
                'value' => round($active->sum('total'), 2),
                'to_collect' => round($orders->where('status', 'pending')->sum('total'), 2),
            ],
        ]);
    }

    public function toggle(PreorderSession $session): RedirectResponse
    {
        $session->update(['status' => $session->status === 'open' ? 'closed' : 'open']);

        return back()->with([
            'type' => 'success',
            'message' => $session->status === 'open'
                ? 'Form reopened. Customers can order again.'
                : 'Form closed. Customers can no longer order.',
        ]);
    }

    public function regenerateLink(PreorderSession $session): RedirectResponse
    {
        $session->update(['public_token' => PreorderSession::newToken()]);

        return back()->with(['type' => 'success', 'message' => 'New link created. The old link no longer works.']);
    }

    public function destroy(PreorderSession $session): RedirectResponse
    {
        if ($session->orders()->exists()) {
            return back()->with(['type' => 'error', 'message' => 'This session has orders, so it cannot be deleted. Close it instead.']);
        }

        DB::transaction(function () use ($session) {
            $session->items()->delete();
            $session->delete();
        });

        return redirect()->route('preorders.index')->with(['type' => 'success', 'message' => 'Pre-order session deleted.']);
    }

    public function cancelOrder(Request $request, Preorder $order): RedirectResponse
    {
        $validated = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);
        if ($order->status !== 'pending') {
            throw ValidationException::withMessages(['reason' => "Only pending orders can be cancelled."]);
        }
        $order->update(['status' => 'cancelled', 'cancel_reason' => $validated['reason'] ?? null]);

        return back()->with(['type' => 'success', 'message' => "Order {$order->order_no} cancelled."]);
    }

    public function restoreOrder(Preorder $order): RedirectResponse
    {
        if ($order->status !== 'cancelled') {
            return back();
        }
        $order->update(['status' => 'pending', 'cancel_reason' => null]);

        return back()->with(['type' => 'success', 'message' => "Order {$order->order_no} restored."]);
    }

    /** Order slips for packing: ?ids=a,b for chosen orders, otherwise every pending order. */
    public function slips(Request $request, PreorderSession $session)
    {
        $query = $session->orders()->with('lines');
        if ($ids = array_filter(explode(',', (string) $request->query('ids')))) {
            $query->whereIn('id', $ids);
        } else {
            $query->where('status', 'pending');
        }
        $orders = $query->orderBy('customer_name')->get();

        return Pdf::loadView('pdf.preorder-slips', [
            'session' => $session,
            'orders' => $orders,
            'shop' => Setting::store(),
        ])->setPaper('a4')->stream("order-slips-{$session->id}.pdf");
    }

    /** Totals of what to pack, plus a per-customer checklist. */
    public function summaryPdf(PreorderSession $session)
    {
        $orders = $session->orders()->with('lines')->where('status', 'pending')->orderBy('customer_name')->get();
        $summary = $this->preorders->packingSummary($session, $this->ledger->availableMap());
        $columns = collect($summary['items'])->where('pending_units', '>', 0)->count();

        return Pdf::loadView('pdf.preorder-summary', [
            'session' => $session,
            'summary' => $summary,
            'orders' => $orders,
            'shop' => Setting::store(),
        ])->setPaper('a4', $columns > 5 ? 'landscape' : 'portrait')->stream("packing-summary-{$session->id}.pdf");
    }

    /* ------------------------------------------------------------------ */

    private function formProps(?PreorderSession $session): array
    {
        return [
            'session' => $session?->load('items')->toArray(),
            'orderedUnits' => $session ? $this->preorders->orderedUnits($session) : (object) [],
            'products' => Product::where('is_active', '1')->orderBy('product_name')
                ->get(['id', 'product_name', 'product_sku_code', 'product_unit', 'product_num_of_measure', 'product_price']),
            'events' => SalesEvent::where('status', 'open')->orderBy('start_date')->get(['id', 'name']),
        ];
    }

    private function validateSession(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sales_event_id' => ['nullable', 'string', StoreRule::exists('sales_events')],
            'pickup_location' => ['required', 'string', 'max:255'],
            'pickup_date' => ['required', 'date'],
            'pickup_time' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:3000'],
            'closes_at' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'string'],
            // Empty product = an item not in the product list: sold and reported, no stock moved.
            'items.*.product_id' => ['nullable', 'string', StoreRule::exists('products')],
            'items.*.label' => ['required', 'string', 'max:255'],
            'items.*.unit_quantity' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.max_per_order' => ['nullable', 'integer', 'min:1'],
            'items.*.quota' => ['nullable', 'integer', 'min:0'],
        ], [
            'items.required' => 'Add at least one item customers can order.',
        ], [
            'items.*.product_id' => 'product',
            'items.*.label' => 'item name',
            'items.*.unit_quantity' => 'units per item',
            'items.*.max_per_order' => 'max per order',
        ]);
    }

    private function sessionFields(array $v): array
    {
        return [
            'name' => $v['name'],
            'sales_event_id' => $v['sales_event_id'] ?? null,
            'pickup_location' => $v['pickup_location'],
            'pickup_date' => $v['pickup_date'],
            'pickup_time' => $v['pickup_time'] ?? null,
            'remarks' => $v['remarks'] ?? null,
            'closes_at' => $v['closes_at'] ?? null,
        ];
    }

    /** Update the offered items, keeping ids so existing orders still point at them. */
    private function syncItems(PreorderSession $session, array $items): void
    {
        $existing = $session->items()->get()->keyBy('id');
        $keep = [];

        foreach (array_values($items) as $i => $item) {
            $fields = [
                'product_id' => ($item['product_id'] ?? null) ?: null,
                'label' => trim($item['label']),
                'unit_quantity' => ($item['product_id'] ?? null) ? (int) $item['unit_quantity'] : 1,
                'price' => round((float) $item['price'], 2),
                'max_per_order' => $item['max_per_order'] ?? null,
                'quota' => $item['quota'] ?? null,
                'sort_order' => $i,
            ];
            $current = isset($item['id']) ? $existing->get($item['id']) : null;
            if ($current) {
                $current->update($fields);
                $keep[] = $current->id;
            } else {
                $keep[] = $session->items()->create($fields)->id;
            }
        }

        $removed = $existing->keys()->diff($keep);
        $ordered = $this->preorders->orderedUnits($session);
        if ($blocked = $removed->first(fn ($id) => ($ordered[$id] ?? 0) > 0)) {
            throw ValidationException::withMessages([
                'items' => "\"{$existing[$blocked]->label}\" already has orders, so it cannot be removed. Set its quota to 0 to stop new orders.",
            ]);
        }

        $session->items()->whereIn('id', $removed)->delete();
    }
}
