<?php

namespace App\Http\Controllers;

use App\Models\Preorder;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Collecting pre-orders at the POS.
 */
class PosPreorderController extends Controller
{
    public function __construct(private SaleService $sales)
    {
    }

    /** Pending orders matching an order number, name or phone. */
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q'));
        $digits = preg_replace('/\D/', '', $q);

        $orders = Preorder::with('lines:id,preorder_id,label,quantity,unit_price,line_total', 'session:id,name,pickup_date,pickup_location')
            ->where('status', 'pending')
            ->when($q !== '', function ($query) use ($q, $digits) {
                $query->where(function ($w) use ($q, $digits) {
                    $w->where('order_no', 'like', "%{$q}%")
                        ->orWhere('customer_name', 'like', "%{$q}%");
                    if (strlen($digits) >= 3) {
                        // Match phone numbers however they were typed (spaces, dashes).
                        $w->orWhereRaw("REPLACE(REPLACE(REPLACE(customer_phone, ' ', ''), '-', ''), '+', '') LIKE ?", ["%{$digits}%"]);
                    }
                });
            })
            ->orderBy('created_at')
            ->limit(30)
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function show(Preorder $order): JsonResponse
    {
        return response()->json(['order' => $order->load('lines', 'session:id,name,pickup_date,pickup_location', 'sale:id,receipt_no')]);
    }

    public function collect(Request $request, Preorder $order): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => ['required', Rule::in(Sale::PAYMENT_METHODS)],
            'amount_tendered' => ['nullable', 'numeric', 'min:0'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
        ]);

        $sale = $this->sales->collectPreorder($order, $validated);

        return response()->json(['sale' => $sale, 'order_no' => $order->order_no], 201);
    }
}
