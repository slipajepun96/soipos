<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\SalesEvent;
use App\Models\Setting;
use App\Models\Stock;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $events = SalesEvent::orderByRaw("status = 'closed'")
            ->orderByDesc('start_date')
            ->get()
            ->map(fn ($event) => array_merge($event->toArray(), [
                'sales_count' => (int) ($totals->get($event->id)->sales_count ?? 0),
                'net' => round((float) ($totals->get($event->id)->net ?? 0), 2),
                'has_sales' => Sale::where('sales_event_id', $event->id)->exists(),
            ]));

        return Inertia::render('Sales/Events/EventsIndex', ['events' => $events]);
    }

    public function store(Request $request): RedirectResponse
    {
        $event = SalesEvent::create($this->validated($request) + [
            'status' => 'open',
            'created_by' => Auth::user()?->name,
        ]);

        return back()->with(['type' => 'success', 'message' => "Event \"{$event->name}\" created. Select it on the POS to tag sales."]);
    }

    public function update(Request $request, SalesEvent $event): RedirectResponse
    {
        $event->update($this->validated($request));

        return back()->with(['type' => 'success', 'message' => 'Event updated.']);
    }

    public function toggle(SalesEvent $event): RedirectResponse
    {
        $event->update(['status' => $event->status === 'open' ? 'closed' : 'open']);

        return back()->with([
            'type' => 'success',
            'message' => $event->status === 'closed'
                ? "\"{$event->name}\" closed. It no longer appears on the POS."
                : "\"{$event->name}\" reopened.",
        ]);
    }

    public function destroy(SalesEvent $event): RedirectResponse
    {
        if (Sale::where('sales_event_id', $event->id)->exists()) {
            throw ValidationException::withMessages(['delete' => 'This event has sales. Close it instead of deleting.']);
        }
        $event->delete();

        return redirect()->route('sales.events.index')->with(['type' => 'success', 'message' => 'Event deleted.']);
    }

    public function show(SalesEvent $event)
    {
        return Inertia::render('Sales/Events/EventReport', $this->report($event));
    }

    public function pdf(SalesEvent $event)
    {
        return Pdf::loadView('pdf.event-report', $this->report($event) + ['shop' => Setting::store()])
            ->setPaper('a4')
            ->download('Event report - ' . preg_replace('/[^A-Za-z0-9 _-]/', '', $event->name) . '.pdf');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string', 'max:2000'],
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
