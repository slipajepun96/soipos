<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\SalesEvent;
use App\Models\SalesEventPartner;
use App\Models\Store;
use App\Support\CurrentStore;
use App\Models\Setting;
use App\Models\Stock;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SalesEventController extends Controller
{
    public function index()
    {
        $totals = Sale::where('status', 'completed')
            ->whereNotNull('sales_event_id')
            ->selectRaw('sales_event_id, COUNT(*) as sales_count, SUM(total) as net')
            ->groupBy('sales_event_id')
            ->get()
            ->keyBy('sales_event_id');

        $partnerIds = SalesEventPartner::with('partnerStore:id,name,short_code')->get()->groupBy('sales_event_id')
            ->map(fn ($rows) => $rows->map(fn ($p) => ['id' => $p->partner_store_id, 'name' => $p->partnerStore?->name, 'short_code' => $p->partnerStore?->short_code]));
        $hosted = $partnerIds->keys();
        $partnerOf = SalesEventPartner::withoutGlobalScope('store')
            ->where('partner_store_id', CurrentStore::id())
            ->join('stores', 'stores.id', '=', 'sales_event_partners.store_id')
            ->pluck('stores.name', 'partner_event_id');

        $events = SalesEvent::orderByRaw("status = 'closed'")
            ->orderByDesc('start_date')
            ->get()
            ->map(fn ($event) => array_merge($event->toArray(), [
                'sales_count' => (int) ($totals->get($event->id)->sales_count ?? 0),
                'net' => round((float) ($totals->get($event->id)->net ?? 0), 2),
                'has_sales' => Sale::where('sales_event_id', $event->id)->exists(),
                'joint_role' => $hosted->contains($event->id) ? 'host' : ($partnerOf->has($event->id) ? 'partner' : null),
                'joint_host' => $partnerOf->get($event->id),
                'partner_stores' => $partnerIds->get($event->id, collect())->values(),
            ]));

        return Inertia::render('Sales/Events/EventsIndex', ['events' => $events, 'partnerStores' => $this->storeOptions()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $event = DB::transaction(function () use ($request) {
            $event = SalesEvent::create(collect($this->validated($request))->except('partner_store_ids')->all() + [
                'status' => 'open',
                'created_by' => Auth::user()?->name,
            ]);
            JointEventController::syncPartners($event, $request->input('partner_store_ids', []));

            return $event;
        });

        return back()->with(['type' => 'success', 'message' => "Event \"{$event->name}\" created. Select it on the POS to tag sales."]);
    }

    public function update(Request $request, SalesEvent $event): RedirectResponse
    {
        $this->ensureNotPartnerCopy($event);
        DB::transaction(function () use ($request, $event) {
            $event->update(collect($this->validated($request))->except('partner_store_ids')->all());
            $this->syncPartnerCopies($event);
            JointEventController::syncPartners($event, $request->input('partner_store_ids', []));
        });

        return back()->with(['type' => 'success', 'message' => 'Event updated.']);
    }

    public function toggle(SalesEvent $event): RedirectResponse
    {
        $this->ensureNotPartnerCopy($event);
        $event->update(['status' => $event->status === 'open' ? 'closed' : 'open']);
        $this->syncPartnerCopies($event);

        return back()->with([
            'type' => 'success',
            'message' => $event->status === 'closed'
                ? "\"{$event->name}\" closed. It no longer appears on the POS."
                : "\"{$event->name}\" reopened.",
        ]);
    }

    public function destroy(SalesEvent $event): RedirectResponse
    {
        $this->ensureNotPartnerCopy($event);
        if ($event->partners()->exists()) {
            throw ValidationException::withMessages(['delete' => 'Remove the partner stores first, or close the event instead.']);
        }
        if (Sale::where('sales_event_id', $event->id)->exists()) {
            throw ValidationException::withMessages(['delete' => 'This event has sales. Close it instead of deleting.']);
        }
        $event->delete();

        return redirect()->route('sales.events.index')->with(['type' => 'success', 'message' => 'Event deleted.']);
    }

    public function show(SalesEvent $event)
    {
        $joint = JointEventController::summary($event);

        return Inertia::render('Sales/Events/EventReport', $this->report($event) + [
            'joint' => $joint,
        ] + ($joint ? JointEventController::productSetup($event) : []));
    }

    public function pdf(SalesEvent $event)
    {
        return Pdf::loadView('pdf.event-report', $this->report($event) + ['shop' => Setting::store(), 'joint' => JointEventController::summary($event)])
            ->setPaper('a4')
            ->download('Event report - ' . preg_replace('/[^A-Za-z0-9 _-]/', '', $event->name) . '.pdf');
    }

    /** A partner's copy of a joint event follows the host's event. */
    private function ensureNotPartnerCopy(SalesEvent $event): void
    {
        if (SalesEventPartner::forPartnerEvent($event->id)) {
            throw ValidationException::withMessages(['event' => 'This joint event is managed by the host store.']);
        }
    }

    private function syncPartnerCopies(SalesEvent $event): void
    {
        $ids = $event->partners()->pluck('partner_event_id');
        if ($ids->isNotEmpty()) {
            SalesEvent::withoutGlobalScope('store')->whereIn('id', $ids)
                ->update($event->only(['name', 'location', 'start_date', 'end_date', 'notes', 'status']));
        }
    }

    /** Stores the user could pick as partners of an event (assigned to them, other than this store). */
    private function storeOptions(): array
    {
        $user = Auth::user();
        $stores = $user->is_master_admin ? Store::query() : $user->stores();

        return $stores->where('stores.is_active', true)->where('stores.id', '!=', CurrentStore::id())
            ->orderBy('stores.name')->get(['stores.id', 'stores.name', 'stores.short_code'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'short_code' => $s->short_code])->values()->all();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'partner_store_ids' => ['nullable', 'array'],
            'partner_store_ids.*' => ['string', Rule::exists('stores', 'id')->where('is_active', true)],
        ]);
    }

    /** Everything the event report shows. */
    private function report(SalesEvent $event): array
    {
        $sales = Sale::where('sales_event_id', $event->id)
            ->withCount('items')
            ->orderBy('created_at')
            ->get();
        $completed = $sales->where('status', 'completed');
        $saleIds = $completed->pluck('id');

        // Products sold, with cost from the stock lines posted for these sales.
        $items = SaleItem::whereIn('sale_id', $saleIds)
            ->selectRaw('MAX(product_id) as product_id, MAX(product_name) as product_name, MAX(product_unit) as product_unit, SUM(quantity) as quantity, SUM(line_total) as revenue')
            ->groupByRaw('COALESCE(product_id, product_name)') // untracked items have no product id
            ->get();
        $costs = Stock::whereIn('stock_doc_num', $completed->pluck('stock_doc_num')->filter())
            ->where('stock_entry_type', 'out')
            ->selectRaw('stock_product_id, SUM(CAST(stock_total_cost AS DECIMAL(15,4))) as cost')
            ->groupBy('stock_product_id')
            ->pluck('cost', 'stock_product_id');

        $products = $items->map(function ($row) use ($costs) {
            $revenue = round((float) $row->revenue, 2);
            $cost = round((float) ($costs[$row->product_id] ?? 0), 2);

            return [
                'product_id' => $row->product_id,
                'product_name' => $row->product_name,
                'product_unit' => $row->product_unit,
                'quantity' => round((float) $row->quantity, 4),
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => round($revenue - $cost, 2),
            ];
        })->sortByDesc('revenue')->values();

        $payments = SalePayment::whereIn('sale_id', $saleIds)->get();
        $net = round($completed->sum('total'), 2);
        $cost = round($products->sum('cost'), 2);

        return [
            'event' => $event,
            'summary' => [
                'net' => $net,
                'gross' => round($completed->sum('subtotal'), 2),
                'discount' => round($completed->sum('discount'), 2),
                'count' => $completed->count(),
                'average' => $completed->count() ? round($net / $completed->count(), 2) : 0,
                'items_sold' => round($products->sum('quantity'), 4),
                'cost' => $cost,
                'profit' => round($net - $cost, 2),
                'margin' => $net > 0 ? round(($net - $cost) / $net * 100, 1) : 0,
                'collected' => round($payments->sum('amount'), 2),
                'outstanding' => round($completed->sum('balance_due'), 2),
                'voided' => $sales->where('status', 'voided')->count(),
                'voided_total' => round($sales->where('status', 'voided')->sum('total'), 2),
            ],
            'by_method' => collect(Sale::PAYMENT_METHODS)->map(fn ($method) => [
                'method' => $method,
                'count' => $payments->where('method', $method)->count(),
                'total' => round($payments->where('method', $method)->sum('amount'), 2),
            ])->values(),
            'by_day' => $completed->groupBy(fn ($s) => $s->sale_date->toDateString())
                ->map(fn ($day, $date) => [
                    'date' => $date,
                    'count' => $day->count(),
                    'net' => round($day->sum('total'), 2),
                ])->sortKeys()->values(),
            'products' => $products,
            'sales' => $sales->sortByDesc('created_at')->values(),
        ];
    }
}
