<?php

namespace App\Http\Controllers;

use App\Models\Preorder;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\SalesEvent;
use App\Models\Setting;
use App\Models\StockDoc;
use App\Services\SaleService;
use App\Services\StockLedger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function __construct(private StockLedger $ledger, private SaleService $sales)
    {
    }

    /** The POS register screen. */
    public function pos()
    {
        return Inertia::render('Sales/Pos', [
            'products' => Product::where('is_active', '1')
                ->orderBy('product_name')
                ->get(['id', 'product_name', 'product_sku_code', 'product_code', 'product_unit',
                    'product_num_of_measure', 'product_price', 'product_img_address', 'product_category_id']),
            'categories' => ProductCategory::orderBy('product_categories_name')
                ->get(['id', 'product_categories_name']),
            'availableStock' => $this->ledger->availableMap(),
            'paymentMethods' => Sale::PAYMENT_METHODS,
            'duitnowQr' => Setting::store()['duitnow_qr'],
            'events' => SalesEvent::where('status', 'open')->orderBy('start_date')->get(['id', 'name', 'location', 'start_date', 'end_date']),
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate(SaleService::rules(), [], SaleService::attributes());
        unset($validated['sale_date']); // POS sales are always dated today

        return response()->json(['sale' => $this->sales->create($validated)], 201);
    }

    /** Sales history with daily totals. */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);
        $from = $filters['from'] ?? now()->toDateString();
        $to = $filters['to'] ?? $from;

        $sales = Sale::withCount('items')
            ->with('event:id,name')
            ->whereBetween('sale_date', [$from, $to])
            ->orderByDesc('created_at')
            ->get();

        $completed = $sales->where('status', 'completed');

        // Money actually received in the period, whichever day the sale was made.
        $collected = SalePayment::query()
            ->join('sales', 'sales.id', '=', 'sale_payments.sale_id')
            ->where('sales.status', 'completed')
            ->whereBetween('sale_payments.payment_date', [$from, $to])
            ->selectRaw('sale_payments.method, COUNT(*) as count, SUM(sale_payments.amount) as total')
            ->groupBy('sale_payments.method')
            ->get()
            ->keyBy('method');

        return Inertia::render('Sales/SalesIndex', [
            'filters' => ['from' => $from, 'to' => $to],
            'sales' => $sales,
            'summary' => [
                'count' => $completed->count(),
                'gross' => round($completed->sum('subtotal'), 2),
                'discount' => round($completed->sum('discount'), 2),
                'net' => round($completed->sum('total'), 2),
                'on_credit' => round($completed->sum('balance_due'), 2),
                'collected' => round($collected->sum('total'), 2),
                'voided' => $sales->where('status', 'voided')->count(),
                'by_method' => collect(Sale::PAYMENT_METHODS)->map(fn ($method) => [
                    'method' => $method,
                    'count' => (int) ($collected->get($method)->count ?? 0),
                    'total' => round((float) ($collected->get($method)->total ?? 0), 2),
                ])->values(),
            ],
        ]);
    }

    public function show(Sale $sale): JsonResponse
    {
        return response()->json(['sale' => $sale->load('items', 'payments')]);
    }

    /** 80mm thermal receipt, shown inline so the browser can print it. */
    public function receipt(Sale $sale)
    {
        $sale->load('items', 'payments');
        $shop = Setting::store();
        $height = 300
            + $sale->items->count() * 30
            + $sale->payments->count() * 14
            + ($sale->discount > 0 ? 14 : 0)
            + ($sale->balance_due > 0 ? 28 : 0)
            + ($shop['email'] ? 12 : 0)
            + substr_count((string) $shop['address'], "\n") * 12
            + ($sale->status === 'voided' ? 70 : 0)
            + ($sale->notes ? 30 : 0);

        return Pdf::loadView('pdf.receipt', ['sale' => $sale, 'shop' => $shop])
            ->setPaper([0, 0, 226.77, $height]) // 80mm wide, in points
            ->stream("{$sale->receipt_no}.pdf");
    }

    public function void(Request $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validate(['reason' => ['required', 'string', 'max:255']]);

        DB::transaction(function () use ($sale, $validated) {
            $sale = Sale::lockForUpdate()->findOrFail($sale->id);
            if ($sale->status === 'voided') {
                throw ValidationException::withMessages(['reason' => 'This sale is already voided.']);
            }

            $doc = $sale->stock_doc_num
                ? StockDoc::where('stock_doc_num', $sale->stock_doc_num)->lockForUpdate()->first()
                : null;
            if ($doc) {
                $this->ledger->deleteDocument($doc); // returns the items to stock
            }

            // A voided pre-order collection goes back to the pending list.
            Preorder::where('sale_id', $sale->id)->update([
                'status' => 'pending', 'sale_id' => null, 'collected_at' => null, 'collected_by' => null,
            ]);

            $sale->update([
                'status' => 'voided',
                'void_reason' => $validated['reason'],
                'voided_by' => Auth::user()?->name,
                'voided_at' => now(),
            ]);
        });

        return back()->with([
            'type' => 'success',
            'message' => ucfirst($sale->document_type) . " {$sale->receipt_no} voided and stock returned.",
        ]);
    }
}
