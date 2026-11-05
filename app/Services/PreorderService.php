<?php

namespace App\Services;

use App\Models\Preorder;
use App\Models\PreorderLine;
use App\Models\PreorderSession;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PreorderService
{
    /** Units ordered per session item, counting pending and collected orders. */
    public function orderedUnits(PreorderSession $session): Collection
    {
        return PreorderLine::query()
            ->join('preorders', 'preorders.id', '=', 'preorder_lines.preorder_id')
            ->where('preorders.preorder_session_id', $session->id)
            ->where('preorders.status', '!=', 'cancelled')
            ->groupBy('preorder_lines.preorder_session_item_id')
            ->selectRaw('preorder_lines.preorder_session_item_id as item_id, SUM(preorder_lines.quantity) as units')
            ->pluck('units', 'item_id')
            ->map(fn ($units) => (int) $units);
    }

    /** Units still available per session item (null = no quota). */
    public function remaining(PreorderSession $session): array
    {
        $ordered = $this->orderedUnits($session);

        return $session->items->mapWithKeys(fn ($item) => [
            $item->id => $item->quota === null ? null : max(0, $item->quota - ($ordered[$item->id] ?? 0)),
        ])->all();
    }

    /**
     * Place an order from the public form.
     *
     * @param  array  $customer  name, phone, address, notes
     * @param  array  $selections  [session item id => units]
     */
    public function place(PreorderSession $session, array $customer, array $selections): Preorder
    {
        return DB::transaction(function () use ($session, $customer, $selections) {
            // Lock the session so two orders cannot both take the last units of a quota.
            $session = PreorderSession::with('items')->lockForUpdate()->findOrFail($session->id);
            if (!$session->acceptingOrders()) {
                throw ValidationException::withMessages(['items' => 'Sorry, this pre-order is closed.']);
            }

            $items = $session->items->keyBy('id');
            $remaining = $this->remaining($session);
            $lines = [];

            foreach ($selections as $itemId => $units) {
                $units = (int) $units;
                if ($units <= 0) {
                    continue;
                }
                $item = $items->get($itemId)
                    ?? throw ValidationException::withMessages(['items' => 'One of the items is no longer available. Please refresh the page.']);

                if ($item->max_per_order && $units > $item->max_per_order) {
                    throw ValidationException::withMessages([
                        "items.{$itemId}" => "You can order up to {$item->max_per_order} × {$item->label}.",
                    ]);
                }
                $left = $remaining[$item->id];
                if ($left !== null && $units > $left) {
                    throw ValidationException::withMessages([
                        "items.{$itemId}" => $left === 0
                            ? "{$item->label} is sold out."
                            : "Only {$left} × {$item->label} left.",
                    ]);
                }

                $lines[] = [
                    'preorder_session_item_id' => $item->id,
                    'product_id' => $item->product_id,
                'tracked' => $item->product_id !== null,
                    'label' => $item->label,
                    'unit_quantity' => $item->unit_quantity,
                    'quantity' => $units,
                    'unit_price' => $item->price,
                    'line_total' => round($units * $item->price, 2),
                ];
            }

            if (!$lines) {
                throw ValidationException::withMessages(['items' => 'Choose at least one item.']);
            }

            $order = Preorder::create([
                'order_no' => Preorder::nextNumber(),
                'preorder_session_id' => $session->id,
                'customer_name' => $customer['name'],
                'customer_phone' => $customer['phone'],
                'customer_address' => $customer['address'] ?? null,
                'notes' => $customer['notes'] ?? null,
                'total' => round(collect($lines)->sum('line_total'), 2),
                'status' => 'pending',
            ]);
            $order->lines()->createMany($lines);

            return $order->load('lines');
        });
    }

    /**
     * What to pack for a session: per item, units and stock needed, split by status.
     */
    public function packingSummary(PreorderSession $session, array $stock = []): array
    {
        $session->loadMissing('items.product');
        $lines = PreorderLine::query()
            ->join('preorders', 'preorders.id', '=', 'preorder_lines.preorder_id')
            ->where('preorders.preorder_session_id', $session->id)
            ->where('preorders.status', '!=', 'cancelled')
            ->get(['preorder_lines.*', 'preorders.status as order_status']);

        $items = $session->items->map(function ($item) use ($lines, $stock) {
            $mine = $lines->where('preorder_session_item_id', $item->id);
            $pending = $mine->where('order_status', 'pending');
            $pendingUnits = (int) $pending->sum('quantity');

            return [
                'id' => $item->id,
                'label' => $item->label,
                'product_id' => $item->product_id,
                'tracked' => $item->product_id !== null,
                'product_name' => $item->product?->product_name,
                'product_unit' => $item->product?->product_unit,
                'unit_quantity' => $item->unit_quantity,
                'price' => $item->price,
                'quota' => $item->quota,
                'orders' => $mine->pluck('preorder_id')->unique()->count(),
                'units' => (int) $mine->sum('quantity'),
                'pending_units' => $pendingUnits,
                'collected_units' => (int) $mine->where('order_status', 'collected')->sum('quantity'),
                'stock_needed' => round($pendingUnits * $item->unit_quantity, 4),
                'value' => round($mine->sum('line_total'), 2),
            ];
        });

        // Stock needed per product for orders still to collect, against stock on hand.
        // Untracked items (no product) have no stock to check.
        $products = $items->whereNotNull('product_id')->groupBy('product_id')->map(fn ($group, $productId) => [
            'product_id' => $productId,
            'product_name' => $group->first()['product_name'],
            'product_unit' => $group->first()['product_unit'],
            'needed' => round($group->sum('stock_needed'), 4),
            'on_hand' => round((float) ($stock[$productId] ?? 0), 4),
        ])->map(fn ($row) => $row + ['short' => max(0, round($row['needed'] - $row['on_hand'], 4))])->values();

        return ['items' => $items->values()->all(), 'products' => $products->all()];
    }
}
