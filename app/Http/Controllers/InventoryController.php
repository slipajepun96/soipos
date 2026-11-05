<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\StockDoc;
use App\Models\Supplier;
use App\Services\StockLedger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public const STOCK_IN_TYPES = ['GRN', 'Opening Stock'];
    public const STOCK_OUT_TYPES = ['SOD', 'Sales Invoice'];
    public const ADJUSTMENT_TYPES = ['Stock Adjustment', 'Item Disposal Note'];

    /** URL slug => document type for the stock-out form. */
    private const STOCK_OUT_SLUGS = [
        'sod' => 'SOD',
        'sales-invoice' => 'Sales Invoice',
    ];

    public function __construct(private StockLedger $ledger)
    {
    }

    /* ------------------------------------------------------------------
     | Overview
     * ------------------------------------------------------------------ */

    public function index()
    {
        return Inertia::render('Inventory&Products/InventoryIndex', [
            'balance' => $this->balanceRows(),
            'counts' => [
                'stock_in' => StockDoc::whereIn('stock_doc_type', self::STOCK_IN_TYPES)->count(),
                'stock_out' => StockDoc::whereIn('stock_doc_type', self::STOCK_OUT_TYPES)->count(),
                'adjustment' => StockDoc::whereIn('stock_doc_type', self::ADJUSTMENT_TYPES)->count(),
            ],
        ]);
    }

    public function stockBalance()
    {
        return Inertia::render('Inventory&Products/Inventory/StockBalance', [
            'balance' => $this->balanceRows(),
        ]);
    }

    /* ------------------------------------------------------------------
     | Stock In
     * ------------------------------------------------------------------ */

    public function stockInIndex()
    {
        return Inertia::render('Inventory&Products/Inventory/StockIn/StockInIndex', [
            'stock_docs' => $this->documents(self::STOCK_IN_TYPES),
        ]);
    }

    public function addGRN()
    {
        return Inertia::render('Inventory&Products/Inventory/StockIn/AddGRN', $this->stockInFormProps());
    }

    public function addOpeningStock()
    {
        return Inertia::render('Inventory&Products/Inventory/StockIn/AddOpeningStock', $this->stockInFormProps());
    }

    public function saveGRN(Request $request): RedirectResponse
    {
        return $this->saveStockIn($request, 'GRN');
    }

    public function saveOpeningStock(Request $request): RedirectResponse
    {
        return $this->saveStockIn($request, 'Opening Stock');
    }

    public function viewStockDoc($id)
    {
        $stock_doc = StockDoc::findOrFail($id);

        return Inertia::render('Inventory&Products/Inventory/StockIn/ViewStockDoc', [
            'stock_doc' => $stock_doc,
            'stocks' => Stock::where('stock_doc_num', $stock_doc->stock_doc_num)->get(),
        ]);
    }

    public function deleteStockDoc(string $id): RedirectResponse
    {
        return $this->deleteDocument($id, self::STOCK_IN_TYPES, 'inventory.stockIn.index');
    }

    private function saveStockIn(Request $request, string $type): RedirectResponse
    {
        $isGrn = $type === 'GRN';

        $validated = $request->validate([
            'supplier_id' => [$isGrn ? 'required' : 'nullable', 'string', Rule::exists('suppliers', 'id')],
            'document_date' => ['required', 'date'],
            'transportation_mode' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string', Rule::exists('products', 'id')],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.expiry_date' => ['nullable', 'date'],
        ], [], [
            'supplier_id' => 'supplier',
            'document_date' => $isGrn ? 'received date' : 'opening stock date',
        ]);

        $supplier = !empty($validated['supplier_id']) ? Supplier::find($validated['supplier_id']) : null;
        $products = Product::whereIn('id', collect($validated['items'])->pluck('product_id'))->get()->keyBy('id');

        $lines = collect($validated['items'])->map(function ($item) use ($products, $supplier) {
            $quantity = (float) $item['quantity'];
            $unitCost = (float) $item['unit_cost'];

            return [
                'product' => $products->get($item['product_id']),
                'entry_type' => 'in',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => round($quantity * $unitCost, 2),
                'expiry_date' => $item['expiry_date'] ?? null,
                'supplier_id' => $supplier?->id ?? 'N/A',
            ];
        })->all();

        $docNum = DB::transaction(fn () => $this->createDocument($type, $validated['document_date'], [
            'supplier_id' => $supplier?->id ?? 'N/A',
            'name' => $supplier?->supplier_name ?? 'Opening balance',
            'reference' => $supplier?->supplier_rob_num ?? '',
            'address' => $supplier?->supplier_address ?? '',
            'phone' => $supplier?->supplier_phone_num,
            'email' => $supplier?->supplier_email,
        ], $lines, $validated['remarks'] ?? null, $validated['transportation_mode'] ?? null));

        return Redirect::route('inventory.stockIn.index')->with([
            'type' => 'success',
            'message' => "{$type} {$docNum} saved successfully.",
        ]);
    }

    private function stockInFormProps(): array
    {
        return [
            'products' => Product::where('is_active', '1')->orderBy('product_name')->get(),
            'suppliers' => Supplier::where('is_active', '1')->orderBy('supplier_name')->get(),
        ];
    }

    /* ------------------------------------------------------------------
     | Stock Out
     * ------------------------------------------------------------------ */

    public function stockOutIndex()
    {
        return Inertia::render('Inventory&Products/Inventory/StockOut/StockOutIndex', [
            'stock_docs' => $this->documents(self::STOCK_OUT_TYPES),
        ]);
    }

    public function addStockOut(Request $request)
    {
        $slug = $request->query('type', 'sod');
        if ($slug === 'sales-invoice') {
            return redirect()->route('sales.invoices.create');
        }
        abort_unless(isset(self::STOCK_OUT_SLUGS[$slug]), 404);

        return Inertia::render('Inventory&Products/Inventory/StockOut/AddStockOut', [
            'documentType' => self::STOCK_OUT_SLUGS[$slug],
            'products' => Product::where('is_active', '1')->orderBy('product_name')->get(),
            'availableStock' => $this->availableStockMap(),
        ]);
    }

    public function saveStockOut(Request $request): RedirectResponse
    {
        $isInvoice = $request->input('document_type') === 'Sales Invoice';

        $validated = $request->validate([
            'document_type' => ['required', Rule::in(['SOD'])], // sales invoices are created from Sales
            'document_date' => ['required', 'date'],
            'recipient_name' => ['nullable', 'string', 'max:255', Rule::requiredIf($isInvoice)],
            'recipient_reference' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string', $this->activeProductRule()],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.sales_unit_price' => ['nullable', 'numeric', 'min:0', Rule::requiredIf($isInvoice)],
        ], [], ['recipient_name' => 'customer']);

        $docNum = DB::transaction(function () use ($validated, $isInvoice) {
            $lines = $this->outboundLines($validated['items'], function ($item, $quantity) use ($isInvoice) {
                if (!$isInvoice) {
                    return [];
                }
                $price = (float) $item['sales_unit_price'];

                return [
                    'sales_unit_price' => $price,
                    'total_sales_price' => round($quantity * $price, 2),
                ];
            });

            return $this->createDocument($validated['document_type'], $validated['document_date'], [
                'name' => ($validated['recipient_name'] ?? null) ?: 'Internal use',
                'reference' => $validated['recipient_reference'] ?? '',
            ], $lines, $validated['remarks'] ?? null);
        });

        return Redirect::route('inventory.stockOut.index')->with([
            'type' => 'success',
            'message' => "{$validated['document_type']} {$docNum} saved successfully.",
        ]);
    }

    public function deleteStockOut(string $id): RedirectResponse
    {
        return $this->deleteDocument($id, self::STOCK_OUT_TYPES, 'inventory.stockOut.index');
    }

    /* ------------------------------------------------------------------
     | Inventory Adjustment & Dispose
     * ------------------------------------------------------------------ */

    public function adjustmentIndex()
    {
        return Inertia::render('Inventory&Products/Inventory/Adjustment/AdjustmentIndex', [
            'stock_docs' => $this->documents(self::ADJUSTMENT_TYPES),
        ]);
    }

    public function addAdjustment()
    {
        return Inertia::render('Inventory&Products/Inventory/Adjustment/AddAdjustment', [
            'products' => Product::where('is_active', '1')->orderBy('product_name')->get(),
            'availableStock' => $this->availableStockMap(),
        ]);
    }

    public function addDisposal()
    {
        return Inertia::render('Inventory&Products/Inventory/Adjustment/AddDisposal', [
            'products' => Product::where('is_active', '1')->orderBy('product_name')->get(),
            'availableStock' => $this->availableStockMap(),
        ]);
    }

    /**
     * Stock count adjustment: the user enters the physically counted quantity and
     * the difference against the system balance is posted as an in or out entry.
     */
    public function saveAdjustment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'document_date' => ['required', 'date'],
            'remarks' => ['required', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string', 'distinct', $this->activeProductRule()],
            'items.*.counted_quantity' => ['required', 'numeric', 'min:0'],
        ], [], ['remarks' => 'reason']);

        $docNum = DB::transaction(function () use ($validated) {
            $productIds = collect($validated['items'])->pluck('product_id');
            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');
            $totals = $this->stockTotals($productIds->all());

            $lines = [];
            foreach ($validated['items'] as $item) {
                $product = $products->get($item['product_id']);
                $system = $this->balanceOf($totals, $product->id);
                $difference = round((float) $item['counted_quantity'] - $system, 4);

                if (abs($difference) < 0.00005) {
                    continue;
                }

                $unitCost = $this->averageCostOf($totals, $product->id);
                $quantity = abs($difference);

                $lines[] = [
                    'product' => $product,
                    'entry_type' => $difference > 0 ? 'in' : 'out',
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => round($quantity * $unitCost, 2),
                    'remarks' => "System {$system}, counted {$item['counted_quantity']}",
                ];
            }

            if (empty($lines)) {
                throw ValidationException::withMessages([
                    'items' => 'Counted quantities match the system balance. Nothing to adjust.',
                ]);
            }

            return $this->createDocument('Stock Adjustment', $validated['document_date'], [
                'name' => 'Stock count',
            ], $lines, $validated['remarks']);
        });

        return Redirect::route('inventory.adjustment.index')->with([
            'type' => 'success',
            'message' => "Stock Adjustment {$docNum} saved successfully.",
        ]);
    }

    public function saveDisposal(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'document_date' => ['required', 'date'],
            'remarks' => ['required', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string', $this->activeProductRule()],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
        ], [], ['remarks' => 'disposal reason']);

        $docNum = DB::transaction(function () use ($validated) {
            $lines = $this->outboundLines($validated['items']);

            return $this->createDocument('Item Disposal Note', $validated['document_date'], [
                'name' => 'Disposal',
            ], $lines, $validated['remarks']);
        });

        return Redirect::route('inventory.adjustment.index')->with([
            'type' => 'success',
            'message' => "Item Disposal Note {$docNum} saved successfully.",
        ]);
    }

    public function deleteAdjustment(string $id): RedirectResponse
    {
        return $this->deleteDocument($id, self::ADJUSTMENT_TYPES, 'inventory.adjustment.index');
    }

    /* ------------------------------------------------------------------
     | Stock Card
     * ------------------------------------------------------------------ */

    public function stockCard(Request $request)
    {
        [$product, $from, $to, $card] = $this->stockCardData($request);

        return Inertia::render('Inventory&Products/Inventory/StockCard', [
            'products' => Product::orderBy('product_name')->get(['id', 'product_name', 'product_sku_code', 'product_unit', 'product_num_of_measure']),
            'filters' => ['product_id' => $product?->id, 'from' => $from, 'to' => $to],
            'product' => $product,
            'card' => $card,
        ]);
    }

    public function stockCardPdf(Request $request)
    {
        [$product, $from, $to, $card] = $this->stockCardData($request);
        abort_unless($product, 404);

        $fileName = 'Stock Card - ' . preg_replace('/[^A-Za-z0-9 _-]/', '', $product->product_name)
            . " ({$from} to {$to}).pdf";

        return Pdf::loadView('pdf.stock-card', [
            'product' => $product,
            'from' => $from,
            'to' => $to,
            'card' => $card,
        ])->setPaper('a4')->download($fileName);
    }

    /** @return array{0: ?Product, 1: string, 2: string, 3: ?array} */
    private function stockCardData(Request $request): array
    {
        $filters = $request->validate([
            'product_id' => ['nullable', 'string'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $from = $filters['from'] ?? now()->startOfYear()->toDateString();
        $to = $filters['to'] ?? now()->toDateString();
        $product = !empty($filters['product_id']) ? Product::find($filters['product_id']) : null;

        if (!$product) {
            return [null, $from, $to, null];
        }

        $signed = 'CASE WHEN stock_entry_type = ? THEN CAST(stock_quantity AS DECIMAL(15,4)) ELSE -CAST(stock_quantity AS DECIMAL(15,4)) END';
        $opening = (float) Stock::where('stock_product_id', $product->id)
            ->where('stock_date', '<', $from)
            ->selectRaw("COALESCE(SUM({$signed}), 0) as qty", ['in'])
            ->value('qty');

        $entries = Stock::where('stock_product_id', $product->id)
            ->whereBetween('stock_date', [$from, $to])
            ->orderBy('stock_date')
            ->orderBy('created_at')
            ->get();

        $docs = StockDoc::whereIn('stock_doc_num', $entries->pluck('stock_doc_num')->unique())
            ->get()
            ->keyBy('stock_doc_num');

        $running = $opening;
        $movements = $entries->map(function ($entry) use (&$running, $docs) {
            $quantity = (float) $entry->stock_quantity;
            $isIn = $entry->stock_entry_type === 'in';
            $running += $isIn ? $quantity : -$quantity;
            $doc = $docs->get($entry->stock_doc_num);

            return [
                'id' => $entry->id,
                'date' => $entry->stock_date,
                'doc' => $doc,
                'doc_num' => $entry->stock_doc_num,
                'doc_type' => $entry->stock_doc_type,
                'party' => $doc?->stock_doc_supplier_name,
                'in' => $isIn ? $quantity : 0,
                'out' => $isIn ? 0 : $quantity,
                'unit_cost' => (float) $entry->stock_unit_cost,
                'balance' => round($running, 4),
                'remarks' => $entry->stock_remarks,
            ];
        })->values();

        return [$product, $from, $to, [
            'opening' => round($opening, 4),
            'total_in' => round($movements->sum('in'), 4),
            'total_out' => round($movements->sum('out'), 4),
            'closing' => round($running, 4),
            'movements' => $movements,
        ]];
    }

    /* ------------------------------------------------------------------
     | Shared document endpoints
     * ------------------------------------------------------------------ */

    public function getStockDocDetails(string $id)
    {
        $stockDoc = StockDoc::findOrFail($id);

        return response()->json([
            'stock_doc' => $stockDoc,
            'stocks' => Stock::where('stock_doc_num', $stockDoc->stock_doc_num)->orderBy('created_at')->get(),
        ]);
    }

    public function getStockOutDetails(string $id)
    {
        return $this->getStockDocDetails($id);
    }

    public function downloadGRN(string $id)
    {
        $stockDoc = StockDoc::findOrFail($id);
        $stocks = Stock::where('stock_doc_num', $stockDoc->stock_doc_num)->orderBy('created_at')->get();

        return Pdf::loadView('pdf.grn', [
            'stock_doc' => $stockDoc,
            'stocks' => $stocks,
        ])->setPaper('a4')->download($stockDoc->stock_doc_num . '.pdf');
    }

    /* ------------------------------------------------------------------
     | Helpers
     * ------------------------------------------------------------------ */

    private function documents(array $types): Collection
    {
        return StockDoc::whereIn('stock_doc_type', $types)
            ->orderBy('stock_doc_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    private function activeProductRule()
    {
        return Rule::exists('products', 'id')->where(fn ($query) => $query->where('is_active', '1'));
    }

    private function balanceRows(): Collection
    {
        $totals = $this->stockTotals();

        return Product::where('is_active', '1')->orderBy('product_name')->get()
            ->map(function ($product) use ($totals) {
                $row = $totals->get($product->id);
                $in = (float) ($row->total_in ?? 0);
                $out = (float) ($row->total_out ?? 0);
                $averageCost = $this->averageCostOf($totals, $product->id);

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->product_name,
                    'product_sku_code' => $product->product_sku_code,
                    'product_unit' => $product->product_unit,
                    'product_num_of_measure' => $product->product_num_of_measure,
                    'product_low_stock_limit' => $product->product_low_stock_limit,
                    'total_in' => $in,
                    'total_out' => $out,
                    'balance' => round($in - $out, 4),
                    'average_cost' => $averageCost,
                    'stock_value' => round(($in - $out) * $averageCost, 2),
                ];
            })->values();
    }

    /**
     * Delete a document after checking it would not leave negative stock.
     */
    private function deleteDocument(string $id, array $allowedTypes, string $redirectRoute): RedirectResponse
    {
        DB::transaction(function () use ($id, $allowedTypes) {
            $doc = StockDoc::lockForUpdate()->findOrFail($id);
            abort_unless(in_array($doc->stock_doc_type, $allowedTypes, true), 404);

            if (Sale::where('stock_doc_num', $doc->stock_doc_num)->exists()) {
                throw ValidationException::withMessages([
                    'delete' => "{$doc->stock_doc_num} belongs to a POS sale. Void it from Sales instead.",
                ]);
            }

            $this->ledger->deleteDocument($doc);
        });

        return Redirect::route($redirectRoute)->with([
            'type' => 'success',
            'message' => 'Document deleted successfully.',
        ]);
    }

    /* Thin wrappers around the shared stock ledger. */
    private function stockTotals(?array $productIds = null): Collection { return $this->ledger->totals($productIds); }
    private function balanceOf(Collection $totals, string $productId): float { return $this->ledger->balanceOf($totals, $productId); }
    private function averageCostOf(Collection $totals, string $productId): float { return $this->ledger->averageCostOf($totals, $productId); }
    private function availableStockMap(): array { return $this->ledger->availableMap(); }
    private function outboundLines(array $items, ?callable $extra = null): array { return $this->ledger->outboundLines($items, $extra); }
    private function createDocument(string $type, string $date, array $party, array $lines, ?string $remarks = null, ?string $transport = null): string
    {
        return $this->ledger->createDocument($type, $date, $party, $lines, $remarks, $transport);
    }
}
