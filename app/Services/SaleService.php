<?php

namespace App\Services;

use App\Support\StoreRule;
use App\Models\Preorder;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SalesEvent;
use App\Models\StockDoc;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Creates POS receipts and invoices.
 *
 * Both post a Sales Invoice stock document straight away.
 */
class SaleService
{
    public function __construct(private StockLedger $ledger)
    {
    }

    /** Validation rules shared by the POS checkout and the invoice form. */
    public static function rules(): array
    {
        return [
            'document_type' => ['required', Rule::in(['receipt', 'invoice'])],
            'sales_event_id' => ['nullable', 'string',
                StoreRule::exists('sales_events')->where(fn ($q) => $q->where('status', 'open'))],
            'sale_date' => ['nullable', 'date', 'before_or_equal:today'],
            'due_date' => ['nullable', 'date'],
            'customer_name' => ['nullable', 'string', 'max:255', 'required_if:document_type,invoice'],
            'customer_company' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_address' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string',
                StoreRule::exists('products')->where(fn ($q) => $q->where('is_active', '1'))],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'pay_later' => ['boolean'],
            'payment_method' => ['nullable', Rule::in(Sale::PAYMENT_METHODS), 'required_unless:pay_later,true'],
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'amount_tendered' => ['nullable', 'numeric', 'min:0'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
        ];
    }

    public static function attributes(): array
    {
        return [
            'items' => 'items',
            'customer_name' => 'customer name',
            'customer_phone' => 'phone number',
            'payment_amount' => 'amount paid',
            'sales_event_id' => 'event',
        ];
    }

    /**
     * @param  array  $data  validated against rules()
     * @param  array|null  $resolved  priced lines built by the caller instead of from $data['items']
     */
    public function create(array $data, ?array $resolved = null): Sale
    {
        $type = $data['document_type'];
        $allowsCredit = $type === 'invoice';
        $payLater = (bool) ($data['pay_later'] ?? false);

        if ($payLater && !$allowsCredit) {
            throw ValidationException::withMessages(['pay_later' => 'Pay later is only available for invoices.']);
        }

        return DB::transaction(function () use ($data, $type, $allowsCredit, $payLater, $resolved) {
            $resolved ??= $this->resolveItems($data['items']);

            // Bundles ("Bakul") take stock out of each of their components. Lines without a product
            // (untracked items) or for no-stock products are sold but move no stock.
            $tracked = array_values(array_filter(
                $this->ledger->expandBundles($resolved),
                fn ($line) => $line['product'] !== null && $line['product']->track_stock && ! $line['product']->is_bundle,
            ));
            $lines = $this->ledger->outboundLines($tracked, fn ($item) => [
                'sales_unit_price' => $item['stock_unit_price'] ?? $item['unit_price'],
                'total_sales_price' => $item['line_total'],
            ]);

            $subtotal = round(collect($resolved)->sum('line_total'), 2);
            $discount = round((float) ($data['discount'] ?? 0), 2);
            if ($discount > $subtotal) {
                throw ValidationException::withMessages(['discount' => 'Discount cannot be more than the subtotal.']);
            }
            $total = round($subtotal - $discount, 2);

            // How much is paid now.
            $method = $payLater ? null : $data['payment_method'];
            if ($payLater) {
                $paidNow = 0.0;
            } elseif ($allowsCredit && isset($data['payment_amount'])) {
                $paidNow = round((float) $data['payment_amount'], 2); // deposit / partial
                if ($paidNow > $total) {
                    throw ValidationException::withMessages(['payment_amount' => 'Amount paid cannot be more than the total.']);
                }
            } else {
                $paidNow = $total;
            }

            $tendered = $paidNow;
            if ($method === 'Cash' && isset($data['amount_tendered'])) {
                $tendered = round((float) $data['amount_tendered'], 2);
                if ($tendered < $paidNow) {
                    throw ValidationException::withMessages(['amount_tendered' => 'Cash received is less than the amount due.']);
                }
            }

            if ($type === 'invoice' && $paidNow < $total && empty($data['due_date'])) {
                $data['due_date'] = now()->addDays(30)->toDateString();
            }

            $date = $data['sale_date'] ?? now()->toDateString();
            $customer = trim($data['customer_name'] ?? '') ?: 'Walk-in customer';

            if ($lines) {
                $number = $docNum = $this->ledger->createDocument('Sales Invoice', $date, [
                    'name' => ($data['customer_company'] ?? null) ?: $customer,
                    'reference' => $data['customer_phone'] ?? '',
                    'address' => $data['customer_address'] ?? '',
                    'phone' => $data['customer_phone'] ?? null,
                    'email' => $data['customer_email'] ?? null,
                ], $lines, $type === 'invoice' ? 'Invoice' : 'POS sale');
            } else {
                $number = StockDoc::generateCustomId('Sales Invoice', $date);
                $docNum = null;
            }

            $sale = Sale::create([
                'receipt_no' => $number,
                'document_type' => $type,
                'sales_event_id' => $data['sales_event_id'] ?? null,
                'stock_doc_num' => $docNum,
                'sale_date' => $date,
                'due_date' => $type === 'invoice' ? ($data['due_date'] ?? $date) : null,
                'customer_name' => $customer,
                'customer_company' => $data['customer_company'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_email' => $data['customer_email'] ?? null,
                'customer_address' => $data['customer_address'] ?? null,
                'notes' => $data['notes'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'payment_method' => $method,
                'payment_reference' => $data['payment_reference'] ?? null,
                'amount_paid' => 0,
                'amount_tendered' => $method ? $tendered : null,
                'change_due' => $method ? round($tendered - $paidNow, 2) : 0,
                'balance_due' => $total,
                'payment_status' => 'unpaid',
                'cashier_id' => Auth::id(),
                'cashier_name' => Auth::user()?->name ?? ($data['cashier_name'] ?? null),
            ]);

            foreach ($resolved as $line) {
                $sale->items()->create([
                    'product_id' => $line['product']?->id,
                    'product_name' => $line['product']?->product_name ?? $line['option_label'],
                    'product_sku_code' => $line['product']?->product_sku_code,
                    'product_unit' => $line['product']?->product_unit,
                    'product_size' => $line['product']?->sizeLabel(),
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'line_total' => $line['line_total'],
                    'option_label' => $line['option_label'] ?? null,
                    'option_quantity' => $line['option_quantity'] ?? null,
                    'packs' => $line['packs'] ?? null,
                ]);
            }

            if ($paidNow > 0) {
                $sale->payments()->create([
                    'payment_date' => $date,
                    'method' => $method,
                    'amount' => $paidNow,
                    'reference' => $data['payment_reference'] ?? null,
                    'received_by' => Auth::user()?->name,
                ]);
            }
            $sale->refreshBalance();

            return $sale->fresh(['items', 'payments']);
        });
    }

    /**
     * Hand over a pre-order at the POS: take payment, deduct stock and record it as a receipt.
     *
     * @param  array  $payment  payment_method, amount_tendered, payment_reference
     */
    public function collectPreorder(Preorder $order, array $payment): Sale
    {
        return DB::transaction(function () use ($order, $payment) {
            $order = Preorder::with('lines', 'session')->lockForUpdate()->findOrFail($order->id);
            if ($order->status !== 'pending') {
                throw ValidationException::withMessages([
                    'preorder' => "Order {$order->order_no} is already {$order->status}.",
                ]);
            }

            $products = Product::whereIn('id', $order->lines->pluck('product_id'))->get()->keyBy('id');
            $resolved = $order->lines->map(function ($line) use ($products, $order) {
                $product = $line->product_id ? $products->get($line->product_id) : null; // null = untracked item
                if ($line->product_id && !$product) {
                    throw ValidationException::withMessages([
                        'preorder' => "A product on order {$order->order_no} no longer exists.",
                    ]);
                }
                $stockQty = round($line->quantity * $line->unit_quantity, 4);

                return [
                    'product' => $product,
                    'product_id' => $product?->id,
                    'quantity' => $stockQty,
                    'unit_price' => $line->unit_price,
                    'stock_unit_price' => $stockQty > 0 ? round($line->line_total / $stockQty, 4) : 0,
                    'line_total' => $line->line_total,
                    'option_label' => $line->label,
                    'option_quantity' => $line->unit_quantity,
                    'packs' => $line->quantity,
                ];
            })->all();

            $eventId = $order->session?->sales_event_id;
            if ($eventId && !SalesEvent::where('id', $eventId)->where('status', 'open')->exists()) {
                $eventId = null; // the event is closed; keep the sale out of its report
            }

            $sale = $this->create([
                'document_type' => 'receipt',
                'sales_event_id' => $eventId,
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
                'customer_address' => $order->customer_address,
                'notes' => "Pre-order {$order->order_no}" . ($order->session ? " ({$order->session->name})" : ''),
                'discount' => 0,
                'pay_later' => false,
                'payment_method' => $payment['payment_method'],
                'amount_tendered' => $payment['amount_tendered'] ?? null,
                'payment_reference' => $payment['payment_reference'] ?? null,
            ], $resolved);

            $order->update([
                'status' => 'collected',
                'sale_id' => $sale->id,
                'collected_at' => now(),
                'collected_by' => Auth::user()?->name,
            ]);

            return $sale;
        });
    }

    /** Turn submitted items into priced lines. */
    private function resolveItems(array $items): array
    {
        $products = Product::whereIn('id', collect($items)->pluck('product_id'))->get()->keyBy('id');

        return collect($items)->map(function ($item) use ($products) {
            $product = $products->get($item['product_id']);
            $quantity = (float) $item['quantity'];
            $price = round((float) $item['unit_price'], 2);

            return [
                'product' => $product,
                'product_id' => $product->id,
                'quantity' => $quantity,
                'unit_price' => $price,
                'line_total' => round($quantity * $price, 2),
            ];
        })->values()->all();
    }

    /** Record a payment against a balance. */
    public function addPayment(Sale $sale, array $data): void
    {
        DB::transaction(function () use ($sale, $data) {
            $sale = Sale::lockForUpdate()->findOrFail($sale->id);
            $this->recordPayment($sale, $data);
        });
    }

    private function recordPayment(Sale $sale, array $data): void
    {
        if ($sale->status === 'voided') {
            throw ValidationException::withMessages(['amount' => 'This sale has been voided.']);
        }
        if ((float) $data['amount'] - $sale->balance_due > 0.004) {
            throw ValidationException::withMessages([
                'amount' => 'Amount is more than the balance due (RM ' . number_format($sale->balance_due, 2) . ').',
            ]);
        }

        $sale->payments()->create([
            'payment_date' => $data['payment_date'],
            'method' => $data['method'],
            'amount' => round((float) $data['amount'], 2),
            'reference' => $data['reference'] ?? null,
            'received_by' => Auth::user()?->name,
        ]);
        $sale->refreshBalance();
    }
}
