<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Stock;
use App\Models\StockDoc;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Shared stock bookkeeping: balances, average cost, and creating / removing
 * stock documents. Methods that write must be called inside a transaction.
 */
class StockLedger
{
    /** Per-product totals: in/out quantities and the cost of everything received. */
    public function totals(?array $productIds = null): Collection
    {
        return Stock::query()
            ->when($productIds !== null, fn ($query) => $query->whereIn('stock_product_id', $productIds))
            ->selectRaw(
                'stock_product_id, ' .
                'SUM(CASE WHEN stock_entry_type = ? THEN CAST(stock_quantity AS DECIMAL(15,4)) ELSE 0 END) as total_in, ' .
                'SUM(CASE WHEN stock_entry_type = ? THEN CAST(stock_quantity AS DECIMAL(15,4)) ELSE 0 END) as total_out, ' .
                'SUM(CASE WHEN stock_entry_type = ? THEN CAST(COALESCE(stock_total_cost, 0) AS DECIMAL(15,4)) ELSE 0 END) as total_in_cost',
                ['in', 'out', 'in']
            )
            ->groupBy('stock_product_id')
            ->get()
            ->keyBy('stock_product_id');
    }

    public function balanceOf(Collection $totals, string $productId): float
    {
        $row = $totals->get($productId);

        return round((float) ($row->total_in ?? 0) - (float) ($row->total_out ?? 0), 4);
    }

    /** Weighted average cost of everything received for the product. */
    public function averageCostOf(Collection $totals, string $productId): float
    {
        $row = $totals->get($productId);
        $in = (float) ($row->total_in ?? 0);

        return $in > 0 ? round((float) $row->total_in_cost / $in, 4) : 0.0;
    }

    public function availableMap(): array
    {
        return $this->totals()
            ->map(fn ($row) => round((float) $row->total_in - (float) $row->total_out, 4))
            ->all();
    }

    /**
     * Build "out" lines at average cost after checking there is enough stock.
     * Must run inside a transaction.
     */
    public function outboundLines(array $items, ?callable $extra = null): array
    {
        $byProduct = collect($items)->groupBy('product_id');
        $products = Product::whereIn('id', $byProduct->keys())->lockForUpdate()->get()->keyBy('id');
        $totals = $this->totals($byProduct->keys()->all());

        $lines = [];
        foreach ($byProduct as $productId => $productItems) {
            $product = $products->get($productId);
            $available = $this->balanceOf($totals, $productId);
            $requested = (float) $productItems->sum(fn ($item) => (float) $item['quantity']);

            if ($requested - $available > 0.00005) {
                throw ValidationException::withMessages([
                    'items' => "{$product->product_name} has only {$available} {$product->product_unit} in stock.",
                ]);
            }

            $unitCost = $this->averageCostOf($totals, $productId);
            foreach ($productItems as $item) {
                $quantity = (float) $item['quantity'];
                $lines[] = array_merge([
                    'product' => $product,
                    'entry_type' => 'out',
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => round($quantity * $unitCost, 2),
                ], $extra ? $extra($item, $quantity) : []);
            }
        }

        return $lines;
    }

    /**
     * Create a stock document and its stock lines. Must run inside a transaction.
     *
     * @param  array  $party  name, reference, supplier_id, address, phone, email
     * @param  array  $lines  product, entry_type, quantity, unit_cost, total_cost and optional
     *                        sales_unit_price, total_sales_price, expiry_date, supplier_id, remarks
     */
    public function createDocument(string $type, string $date, array $party, array $lines, ?string $remarks = null, ?string $transport = null): string
    {
        $docNum = StockDoc::generateCustomId($type, $date);
        $year = date('Y', strtotime($date));
        $month = date('m', strtotime($date));

        $in = collect($lines)->where('entry_type', 'in')->sum('total_cost');
        $out = collect($lines)->where('entry_type', 'out')->sum('total_cost');
        $totalCost = $type === 'Stock Adjustment' ? $in - $out : $in + $out;
        $hasSales = collect($lines)->contains(fn ($line) => isset($line['total_sales_price']));

        $doc = new StockDoc();
        $doc->id = $docNum;
        $doc->stock_doc_num = $docNum;
        $doc->stock_doc_type = $type;
        $doc->stock_doc_supplier_id = $party['supplier_id'] ?? 'N/A';
        $doc->stock_doc_supplier_name = $party['name'] ?? '';
        $doc->stock_doc_supplier_rob_num = $party['reference'] ?? '';
        $doc->stock_doc_supplier_address = $party['address'] ?? '';
        $doc->stock_doc_supplier_phone_num = $party['phone'] ?? null;
        $doc->stock_doc_supplier_email = $party['email'] ?? null;
        $doc->stock_doc_date = $date;
        $doc->stock_doc_year = $year;
        $doc->stock_doc_month = $month;
        $doc->stock_doc_total_cost = round($totalCost, 2);
        $doc->stock_doc_total_sales_price = $hasSales
            ? round(collect($lines)->sum('total_sales_price'), 2)
            : null;
        $doc->stock_doc_added_by = Auth::id();
        $doc->transportation_mode = $transport;
        $doc->remarks = $remarks;
        $doc->save();

        foreach ($lines as $line) {
            $product = $line['product'];

            $stock = new Stock();
            $stock->stock_doc_type = $type;
            $stock->stock_doc_num = $docNum;
            $stock->stock_entry_type = $line['entry_type'];
            $stock->stock_date = $date;
            $stock->stock_year = $year;
            $stock->stock_month = $month;
            $stock->stock_supplier_id = $line['supplier_id'] ?? 'N/A';
            $stock->stock_product_id = $product->id;
            $stock->stock_product_name = $product->product_name;
            $stock->stock_product_unit = $product->product_unit ?? '';
            $stock->stock_number_of_measure = $product->product_num_of_measure ?? '';
            $stock->stock_quantity = $line['quantity'];
            $stock->stock_unit_cost = $line['unit_cost'];
            $stock->stock_total_cost = $line['total_cost'];
            $stock->stock_unit_sales_price = $line['sales_unit_price'] ?? null;
            $stock->stock_total_sales_price = $line['total_sales_price'] ?? null;
            $stock->stock_expiry_date = $line['expiry_date'] ?? null;
            $stock->stock_remarks = $line['remarks'] ?? $remarks;
            $stock->stock_added_by = Auth::id();
            $stock->save();
        }

        return $docNum;
    }

    /**
     * Remove a document and its stock lines, refusing when that would leave a
     * product with negative stock. Must run inside a transaction.
     */
    public function deleteDocument(StockDoc $doc): void
    {
        $lines = Stock::where('stock_doc_num', $doc->stock_doc_num)->get();
        $totals = $this->totals($lines->pluck('stock_product_id')->unique()->values()->all());

        foreach ($lines->groupBy('stock_product_id') as $productId => $productLines) {
            $removedIn = $productLines->where('stock_entry_type', 'in')->sum(fn ($l) => (float) $l->stock_quantity);
            $removedOut = $productLines->where('stock_entry_type', 'out')->sum(fn ($l) => (float) $l->stock_quantity);
            $after = $this->balanceOf($totals, $productId) - $removedIn + $removedOut;

            if ($after < -0.00005) {
                $name = $productLines->first()->stock_product_name;
                throw ValidationException::withMessages([
                    'delete' => "Cannot delete {$doc->stock_doc_num}: {$name} would drop below zero because that stock has already been issued.",
                ]);
            }
        }

        Stock::where('stock_doc_num', $doc->stock_doc_num)->delete();
        $doc->delete();
    }
}
