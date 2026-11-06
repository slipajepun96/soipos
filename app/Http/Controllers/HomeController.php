<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Preorder;
use App\Models\PreorderSession;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SalesEvent;
use App\Models\Supplier;
use App\Services\StockLedger;
use Inertia\Inertia;

/** Home screen: one card per section, each with a quick number for the current store. */
class HomeController extends Controller
{
    public function __invoke(StockLedger $ledger)
    {
        $live = Sale::where('status', '!=', 'voided');
        $today = (clone $live)->whereDate('sale_date', today());
        $unpaid = (clone $live)->where('document_type', 'invoice')->where('balance_due', '>', 0);

        $stock = $ledger->availableMap();
        $products = Product::where('is_active', '1')->get(['id', 'product_low_stock_limit']);
        $lowStock = $products->filter(function ($p) use ($stock) {
            $limit = (float) $p->product_low_stock_limit;

            return $limit > 0 && ($stock[$p->id] ?? 0) <= $limit;
        })->count();

        return Inertia::render('Home', [
            'stats' => [
                'today_total' => round((float) (clone $today)->sum('total'), 2),
                'today_count' => (clone $today)->count(),
                'sales_count' => (clone $live)->count(),
                'pending_preorders' => Preorder::where('status', 'pending')->count(),
                'open_preorder_forms' => PreorderSession::where('status', 'open')->count(),
                'unpaid_invoices' => (clone $unpaid)->count(),
                'unpaid_total' => round((float) (clone $unpaid)->sum('balance_due'), 2),
                'open_events' => SalesEvent::where('status', 'open')->count(),
                'products' => $products->count(),
                'low_stock' => $lowStock,
                'suppliers' => Supplier::where('is_active', '1')->count(),
                'pending_agents' => Agent::where('agent_status', 'pending')->count(),
            ],
        ]);
    }
}
