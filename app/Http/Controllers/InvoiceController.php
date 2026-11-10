<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\SalesEvent;
use App\Models\Setting;
use App\Services\SaleService;
use App\Services\StockLedger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function __construct(private StockLedger $ledger, private SaleService $sales)
    {
    }

    public function index()
    {
        $invoices = Sale::where('document_type', 'invoice')
            ->withCount('items')
            ->orderByDesc('sale_date')
            ->orderByDesc('created_at')
            ->get();

        $open = $invoices->where('status', 'completed')->where('balance_due', '>', 0);
        $overdue = $open->where('is_overdue', true);

        return Inertia::render('Sales/InvoicesIndex', [
            'invoices' => $invoices,
            'paymentMethods' => Sale::PAYMENT_METHODS,
            'summary' => [
                'outstanding' => round($open->sum('balance_due'), 2),
                'outstanding_count' => $open->count(),
                'overdue' => round($overdue->sum('balance_due'), 2),
                'overdue_count' => $overdue->count(),
                'this_month' => round($invoices->where('status', 'completed')
                    ->filter(fn ($i) => $i->sale_date->isSameMonth(now()))
                    ->sum('total'), 2),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Sales/CreateInvoice', [
            'products' => Product::where('is_active', '1')->orderBy('product_name')->get(),
            'availableStock' => $this->ledger->saleableMap(),
            'paymentMethods' => Sale::PAYMENT_METHODS,
            'events' => SalesEvent::where('status', 'open')->orderBy('start_date')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge(['document_type' => 'invoice']);
        $validated = $request->validate(
            array_merge(SaleService::rules(), ['due_date' => ['nullable', 'date', 'after_or_equal:sale_date']]),
            [],
            SaleService::attributes(),
        );
        $sale = $this->sales->create($validated);

        return redirect()->route('sales.invoices.index')->with([
            'type' => 'success',
            'message' => "Invoice {$sale->receipt_no} created" . ($sale->balance_due > 0
                ? ' — RM ' . number_format($sale->balance_due, 2) . ' outstanding.'
                : ' and paid in full.'),
        ]);
    }

    /** A4 customer invoice. */
    public function pdf(Sale $sale)
    {
        $sale->load('items', 'payments');

        return Pdf::loadView('pdf.invoice', ['sale' => $sale, 'shop' => Setting::store()])
            ->setPaper('a4')
            ->stream("Invoice {$sale->receipt_no}.pdf");
    }

    public function addPayment(Request $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validate([
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'method' => ['required', Rule::in(Sale::PAYMENT_METHODS)],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reference' => ['nullable', 'string', 'max:255'],
        ]);

        $this->sales->addPayment($sale, $validated);
        $sale->refresh();

        return back()->with([
            'type' => 'success',
            'message' => 'Payment of RM ' . number_format((float) $validated['amount'], 2) . " recorded for {$sale->receipt_no}"
                . ($sale->balance_due > 0 ? ' — RM ' . number_format($sale->balance_due, 2) . ' still due.' : ' — fully paid.'),
        ]);
    }

    public function deletePayment(Sale $sale, SalePayment $payment): RedirectResponse
    {
        abort_unless($payment->sale_id === $sale->id, 404);

        DB::transaction(function () use ($sale, $payment) {
            $sale = Sale::lockForUpdate()->findOrFail($sale->id);
            if ($sale->status === 'voided') {
                throw ValidationException::withMessages(['payment' => 'This sale has been voided.']);
            }
            $payment->delete();
            $sale->refreshBalance();
        });

        return back()->with(['type' => 'success', 'message' => 'Payment removed.']);
    }
}
