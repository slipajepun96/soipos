<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\SalesEvent;
use App\Models\SalesEventPartner;
use App\Models\SalesEventProduct;
use App\Support\StoreRule;
use App\Models\Setting;
use App\Models\Store;
use App\Services\SaleService;
use App\Services\StockLedger;
use App\Support\CurrentStore;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Joint events. The store that opens the event is the host: its POS sells products of every
 * partner store and takes all the money. Each checkout is saved as one sale per store (own
 * receipt number, own stock), marked as collected by the host. After the event the host
 * settles with each partner from the settlement report.
 */
class JointEventController extends Controller
{
    public function __construct(private StockLedger $ledger, private SaleService $sales)
    {
    }

    /* ------------------------------------------------------------ partners */

    /**
     * Make the event's partner stores exactly $storeIds: new ones get their own copy of the
     * event; dropped ones are removed (only while they have no sales at it). The user must be
     * assigned to each store they add. Must run inside a transaction.
     */
    public static function syncPartners(SalesEvent $event, array $storeIds): void
    {
        $storeIds = array_values(array_unique(array_filter($storeIds)));
        $current = $event->partners()->with('partnerStore')->get()->keyBy('partner_store_id');

        foreach ($current as $storeId => $partner) {
            if (in_array($storeId, $storeIds, true)) {
                continue;
            }
            if (Sale::withoutGlobalScope('store')->where('sales_event_id', $partner->partner_event_id)->exists()) {
                throw ValidationException::withMessages(['partner_store_ids' => "{$partner->partnerStore?->name} already has sales at this event, so it cannot be removed."]);
            }
            SalesEvent::withoutGlobalScope('store')->whereKey($partner->partner_event_id)->delete();
            SalesEventProduct::withoutGlobalScope('store')->where('sales_event_id', $partner->partner_event_id)->delete();
            $partner->delete();
        }

        foreach ($storeIds as $storeId) {
            if ($current->has($storeId)) {
                continue;
            }
            if ($storeId === $event->store_id) {
                throw ValidationException::withMessages(['partner_store_ids' => 'This store is already the host of the event.']);
            }
            if (! Auth::user()->canUseStore($storeId)) {
                throw ValidationException::withMessages(['partner_store_ids' => 'You can only add stores you are assigned to.']);
            }
            // The partner's own copy of the event, so its sales and reports stay in its store.
            $copy = CurrentStore::using($storeId, fn () => SalesEvent::create([
                'name' => $event->name,
                'location' => $event->location,
                'start_date' => $event->start_date,
                'end_date' => $event->end_date,
                'notes' => $event->notes,
                'status' => $event->status,
                'created_by' => Auth::user()?->name,
            ]));
            $event->partners()->create(['partner_store_id' => $storeId, 'partner_event_id' => $copy->id]);
        }
    }

    /* ------------------------------------------------------------ POS */

    public function pos(SalesEvent $event)
    {
        $this->ensureHostEvent($event);
        if ($event->status !== 'open') {
            return redirect()->route('sales.events.show', $event)->with(['type' => 'error', 'message' => 'Reopen the event to use the joint POS.']);
        }
        $stores = $this->stores($event);
        if ($stores->count() < 2) {
            return redirect()->route('sales.events.show', $event)->with(['type' => 'error', 'message' => 'Add a partner store first.']);
        }

        $products = collect();
        $available = [];
        $categoryNames = collect();
        foreach ($stores as $store) {
            CurrentStore::using($store['id'], function () use ($store, &$products, &$available, &$categoryNames) {
                $names = ProductCategory::pluck('product_categories_name', 'id');
                // Only what the store chose to sell at the event, at its event price.
                $prices = SalesEventProduct::where('sales_event_id', $store['event_id'])->pluck('price', 'product_id');
                $products = $products->concat(Product::where('is_active', '1')->whereIn('id', $prices->keys())->orderBy('product_name')
                    ->get(['id', 'product_name', 'product_sku_code', 'product_code', 'product_unit', 'product_num_of_measure',
                        'product_price', 'product_img_address', 'product_category_id', 'track_stock', 'is_bundle'])
                    ->map(function ($p) use ($store, $names, $prices) {
                        // Categories are per store: group the joint POS by category name instead.
                        $category = $names[$p->product_category_id] ?? 'Other';

                        return array_merge($p->toArray(), [
                            'product_category_id' => $category,
                            'store_id' => $store['id'],
                            'product_price' => (float) $prices[$p->id],
                        ]);
                    }));
                $categoryNames = $categoryNames->concat($names->values());
                if ($products->contains(fn ($p) => $p['store_id'] === $store['id'] && $p['product_category_id'] === 'Other')) {
                    $categoryNames->push('Other'); // products without a category
                }
                $available += $this->ledger->saleableMap();
            });
        }

        return Inertia::render('Sales/Pos', [
            'products' => $products->values(),
            'categories' => $categoryNames->unique()->sort()->values()->map(fn ($n) => ['id' => $n, 'product_categories_name' => $n]),
            'availableStock' => $available,
            'paymentMethods' => Sale::PAYMENT_METHODS,
            'duitnowQr' => Setting::store()['duitnow_qr'],
            'bankAccount' => Setting::bankAccount(),
            'events' => [],
            'joint' => [
                'event' => $event->only(['id', 'name', 'location', 'start_date', 'end_date']),
                'stores' => $stores->values(),
            ],
        ]);
    }

    public function checkout(Request $request, SalesEvent $event): JsonResponse
    {
        $this->ensureHostEvent($event);
        if ($event->status !== 'open') {
            throw ValidationException::withMessages(['event' => 'This event is closed.']);
        }
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', Rule::in(Sale::PAYMENT_METHODS)],
            'amount_tendered' => ['nullable', 'numeric', 'min:0'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
        ], [], SaleService::attributes());

        $stores = $this->stores($event)->keyBy('id');
        $hostId = CurrentStore::id();
        // Each store's event list decides what can be sold and at what price.
        $listed = SalesEventProduct::withoutGlobalScope('store')
            ->whereIn('sales_event_id', $stores->pluck('event_id'))
            ->whereIn('product_id', collect($validated['items'])->pluck('product_id'))
            ->get()->keyBy('product_id');
        $active = Product::withoutGlobalScope('store')->whereIn('id', $listed->keys())->where('is_active', '1')->pluck('id')->flip();

        $groups = collect($validated['items'])->map(function ($item) use ($listed, $active, $stores) {
            $entry = $listed->get($item['product_id']);
            if (! $entry || ! $active->has($item['product_id']) || ! $stores->has($entry->store_id)) {
                throw ValidationException::withMessages(['items' => 'One of the products is no longer on sale at this event. Refresh the page.']);
            }

            return array_merge($item, ['unit_price' => $entry->price, 'store_id' => $entry->store_id]);
        })->groupBy('store_id')->sortBy(fn ($items, $storeId) => $storeId === $hostId ? 0 : 1); // host first: it holds the change

        $partTotal = fn ($items) => round($items->sum(fn ($i) => round($i['quantity'] * round((float) $i['unit_price'], 2), 2)), 2);
        $grand = round($groups->sum($partTotal), 2);
        $method = $validated['payment_method'];
        $tendered = $method === 'Cash' && isset($validated['amount_tendered']) ? round((float) $validated['amount_tendered'], 2) : null;
        if ($tendered !== null && $tendered < $grand) {
            throw ValidationException::withMessages(['amount_tendered' => 'Cash received is less than the total.']);
        }

        $jointId = (string) Str::uuid();
        $host = $stores[$hostId];
        $parts = DB::transaction(function () use ($groups, $stores, $partTotal, $grand, $tendered, $method, $validated, $jointId, $hostId, $host, $event) {
            $parts = [];
            $first = true;
            foreach ($groups as $storeId => $items) {
                $total = $partTotal($items);
                $sale = CurrentStore::using($storeId, function () use ($storeId, $items, $total, $grand, $tendered, $method, $validated, $jointId, $hostId, $host, $event, $stores, $first) {
                    $sale = $this->sales->create([
                        'document_type' => 'receipt',
                        'sales_event_id' => $stores[$storeId]['event_id'],
                        'customer_name' => $validated['customer_name'] ?? null,
                        'customer_phone' => $validated['customer_phone'] ?? null,
                        'notes' => "Joint sale at {$event->name}, paid to {$host['name']}",
                        'items' => $items->map(fn ($i) => collect($i)->except('store_id')->all())->values()->all(),
                        'discount' => 0,
                        'pay_later' => false,
                        'payment_method' => $method,
                        // Change is given once, on the first part.
                        'amount_tendered' => $tendered === null ? null : ($first ? round($total + $tendered - $grand, 2) : $total),
                        'payment_reference' => $validated['payment_reference'] ?? null,
                    ]);
                    $sale->update(['joint_checkout_id' => $jointId, 'collected_by_store_id' => $hostId]);

                    return $sale;
                });
                $first = false;
                $parts[] = [
                    'sale_id' => $sale->id,
                    'store_id' => $storeId,
                    'store_name' => $stores[$storeId]['name'],
                    'short_code' => $stores[$storeId]['short_code'],
                    'receipt_no' => $sale->receipt_no,
                    'total' => $sale->total,
                ];
            }

            return $parts;
        });

        return response()->json(['sale' => [
            'id' => $jointId,
            'joint' => true,
            'document_type' => 'receipt',
            'receipt_no' => collect($parts)->pluck('receipt_no')->join(' + '),
            'total' => $grand,
            'payment_method' => $method,
            'amount_tendered' => $tendered ?? $grand,
            'amount_paid' => $grand,
            'change_due' => $tendered === null ? 0 : round($tendered - $grand, 2),
            'balance_due' => 0,
            'parts' => $parts,
        ]], 201);
    }

    /** One 80mm receipt for a joint checkout, with a section per store. */
    public function receipt(string $joint)
    {
        $sales = $this->jointSales($joint);
        $stores = Store::whereIn('id', $sales->pluck('store_id'))->get()->keyBy('id');
        $first = $sales->first();
        $shop = Setting::store();
        $height = 250 + $sales->count() * 50 + $sales->sum(fn ($s) => $s->items->count()) * 30
            + substr_count((string) $shop['address'], "\n") * 12 + ($shop['email'] ? 12 : 0);

        return Pdf::loadView('pdf.joint-receipt', [
            'sales' => $sales,
            'stores' => $stores,
            'shop' => $shop,
            'first' => $first,
            'total' => round($sales->where('status', 'completed')->sum('total'), 2),
            'tendered' => $first->payment_method === 'Cash' ? round($sales->sum('amount_tendered'), 2) : null,
            'change' => round($sales->sum('change_due'), 2),
        ])->setPaper([0, 0, 226.77, $height])->stream('Joint receipt.pdf');
    }

    /** Photo of the customer's transfer, saved on the payment of every part of the checkout. */
    public function proof(Request $request, string $joint): JsonResponse
    {
        $request->validate(['proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192']], [
            'proof.required' => 'Take or choose a photo of the payment.',
            'proof.max' => 'The payment proof photo must be 8 MB or smaller.',
        ]);
        $file = $request->file('proof');
        $disk = Storage::disk(SalePayment::PROOF_DISK);
        $source = null;

        foreach ($this->jointSales($joint) as $sale) {
            $payment = $sale->payments->last();
            if (! $payment) {
                continue;
            }
            $path = 'payment-proofs/'.$sale->store_id.'/'.Str::uuid().'.'.($file->extension() ?: 'jpg');
            $source === null ? $disk->putFileAs(dirname($path), $file, basename($path)) : $disk->copy($source, $path);
            $source ??= $path;
            CurrentStore::using($sale->store_id, function () use ($payment, $path) {
                $payment->deleteProofFile();
                $payment->update(['proof_path' => $path]);
            });
        }

        return response()->json(['ok' => true]);
    }

    /* ------------------------------------------------------------ event products */

    /** This store's products for the event (its own copy) and their event prices. */
    public function saveProducts(Request $request, SalesEvent $event): RedirectResponse
    {
        if (! SalesEventPartner::forPartnerEvent($event->id) && ! $event->partners()->exists()) {
            throw ValidationException::withMessages(['products' => 'Add a partner store first; event products are for joint events.']);
        }
        $validated = $request->validate([
            'products' => ['present', 'array'],
            'products.*.product_id' => ['required', 'string', 'distinct',
                StoreRule::exists('products')->where(fn ($q) => $q->where('is_active', '1'))],
            'products.*.price' => ['required', 'numeric', 'min:0'],
        ], [
            'products.*.product_id.distinct' => 'Each product can only be listed once.',
            'products.*.price.required' => 'Enter the event price for each product.',
        ], ['products.*.price' => 'event price']);

        DB::transaction(function () use ($event, $validated) {
            SalesEventProduct::where('sales_event_id', $event->id)->delete();
            foreach ($validated['products'] as $row) {
                SalesEventProduct::create([
                    'sales_event_id' => $event->id,
                    'product_id' => $row['product_id'],
                    'price' => round((float) $row['price'], 2),
                ]);
            }
        });

        return back()->with(['type' => 'success', 'message' => count($validated['products']).' product(s) on sale at the event.']);
    }

    /** What the event page needs to edit this store's event products. */
    public static function productSetup(SalesEvent $event): array
    {
        return [
            'eventProducts' => SalesEventProduct::where('sales_event_id', $event->id)->get(['product_id', 'price']),
            'productOptions' => Product::where('is_active', '1')->orderBy('product_name')
                ->get(['id', 'product_name', 'product_sku_code', 'product_unit', 'product_num_of_measure', 'product_price', 'is_bundle', 'track_stock']),
        ];
    }

    /* ------------------------------------------------------------ settlement */

    public function settle(Request $request, SalesEvent $event, SalesEventPartner $partner): RedirectResponse
    {
        abort_unless($partner->sales_event_id === $event->id, 404);
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:255'],
        ], [], ['amount' => 'amount paid']);

        $partner->update([
            'settled_amount' => round((float) $validated['amount'], 2),
            'settled_at' => now(),
            'settled_by' => Auth::user()?->name,
            'settlement_note' => $validated['note'] ?? null,
        ]);

        return back()->with(['type' => 'success', 'message' => 'Settlement recorded.']);
    }

    /**
     * Joint part of an event report: for the host, sales per store and what it owes each
     * partner; for a partner, what the host collected for it. Null for a normal event.
     */
    public static function summary(SalesEvent $event): ?array
    {
        $link = SalesEventPartner::forPartnerEvent($event->id);
        if ($link) {
            $host = Store::find($link->store_id);
            $owed = self::collected($link->partner_event_id, $link->store_id)->sum('total');

            return [
                'role' => 'partner',
                'host' => ['name' => $host?->name, 'short_code' => $host?->short_code],
                'owed' => round($owed, 2),
                'settled_amount' => $link->settled_amount,
                'settled_at' => $link->settled_at,
                'settled_by' => $link->settled_by,
                'settlement_note' => $link->settlement_note,
                'balance' => round($owed - (float) $link->settled_amount, 2),
            ];
        }

        $partners = $event->partners()->with('partnerStore')->get();
        if ($partners->isEmpty()) {
            return null;
        }

        $hostId = $event->store_id;
        $row = function (string $storeId, string $eventId, ?Store $store, ?SalesEventPartner $partner) use ($hostId) {
            $sales = self::collected($eventId, $hostId);
            $total = round($sales->sum('total'), 2);

            return [
                'partner_id' => $partner?->id,
                'store_id' => $storeId,
                'store_name' => $store?->name,
                'short_code' => $store?->short_code,
                'is_host' => $partner === null,
                'count' => $sales->count(),
                'total' => $total,
                'by_method' => collect(Sale::PAYMENT_METHODS)
                    ->mapWithKeys(fn ($m) => [$m => round($sales->where('payment_method', $m)->sum('total'), 2)]),
                'owed' => $partner ? $total : 0,
                'settled_amount' => $partner?->settled_amount,
                'settled_at' => $partner?->settled_at,
                'settled_by' => $partner?->settled_by,
                'settlement_note' => $partner?->settlement_note,
                'balance' => $partner ? round($total - (float) $partner->settled_amount, 2) : 0,
            ];
        };

        $rows = collect([$row($hostId, $event->id, Store::find($hostId), null)])
            ->concat($partners->map(fn ($p) => $row($p->partner_store_id, $p->partner_event_id, $p->partnerStore, $p)));

        return [
            'role' => 'host',
            'stores' => $rows->values(),
            'collected' => round($rows->sum('total'), 2),
            'collected_by_method' => collect(Sale::PAYMENT_METHODS)
                ->mapWithKeys(fn ($m) => [$m => round($rows->sum(fn ($r) => $r['by_method'][$m]), 2)]),
            'owed' => round($rows->sum('owed'), 2),
            'balance' => round($rows->sum('balance'), 2),
        ];
    }

    /* ------------------------------------------------------------ helpers */

    /** Completed joint-POS sales of one store's copy of the event, paid to the host. */
    private static function collected(string $eventId, string $hostId): Collection
    {
        return Sale::withoutGlobalScope('store')
            ->where('sales_event_id', $eventId)
            ->where('collected_by_store_id', $hostId)
            ->where('status', 'completed')
            ->get(['id', 'total', 'payment_method']);
    }

    /** Host first, then partners: id, name, short_code and that store's copy of the event. */
    private function stores(SalesEvent $event): Collection
    {
        $host = Store::find($event->store_id);
        $partners = $event->partners()->with('partnerStore')->get()
            ->filter(fn ($p) => $p->partnerStore?->is_active);

        return collect([[
            'id' => $host->id, 'name' => $host->name, 'short_code' => $host->short_code, 'event_id' => $event->id, 'is_host' => true,
        ]])->concat($partners->map(fn ($p) => [
            'id' => $p->partner_store_id, 'name' => $p->partnerStore->name, 'short_code' => $p->partnerStore->short_code,
            'event_id' => $p->partner_event_id, 'is_host' => false,
        ]))->values();
    }

    /** A partner's copy of a joint event is managed by the host, not here. */
    private function ensureHostEvent(SalesEvent $event): void
    {
        if (SalesEventPartner::forPartnerEvent($event->id)) {
            throw ValidationException::withMessages(['event' => 'This joint event is managed by the host store.']);
        }
    }

    /** All parts of a joint checkout that this store collected the money for, with items and payments. */
    private function jointSales(string $joint): Collection
    {
        $sales = Sale::withoutGlobalScope('store')
            ->where('joint_checkout_id', $joint)
            ->where('collected_by_store_id', CurrentStore::id())
            ->orderByRaw('store_id = ? desc', [CurrentStore::id()])
            ->orderBy('created_at')
            ->get();
        abort_if($sales->isEmpty(), 404);

        // Items and payments belong to each sale's own store.
        return $sales->each(fn ($sale) => CurrentStore::using($sale->store_id, fn () => $sale->load('items', 'payments')));
    }
}
