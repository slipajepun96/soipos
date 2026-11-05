<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Receipt {{ $sale->receipt_no }}</title>
    @php
        $money = fn ($v) => number_format((float) $v, 2);
        $qty = fn ($v) => rtrim(rtrim(number_format((float) $v, 4, '.', ''), '0'), '.');
    @endphp
    <style>
        @page { margin: 10px 12px; }
        body { color: #000; font-family: "DejaVu Sans", sans-serif; font-size: 8px; line-height: 1.35; margin: 0; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .shop { font-size: 11px; font-weight: bold; }
        .muted { color: #444; }
        .rule { border-top: 1px dashed #000; margin: 6px 0; }
        table { border-collapse: collapse; width: 100%; }
        td { padding: 1px 0; vertical-align: top; }
        .item-name { padding-top: 3px; }
        .total td { font-size: 11px; font-weight: bold; padding-top: 3px; }
        .void { border: 1.5px solid #000; font-size: 12px; font-weight: bold; margin: 6px 0; padding: 3px; text-align: center; }
    </style>
</head>
<body>
    <div class="center">
        <div class="shop">{{ $shop['store_name'] }}</div>
        @if ($shop['company_name'])<div>{{ $shop['company_name'] }}@if ($shop['company_reg_no']) <span class="muted">({{ $shop['company_reg_no'] }})</span>@endif</div>@endif
        @if ($shop['address'])<div class="muted">{!! nl2br(e($shop['address'])) !!}</div>@endif
        @if ($shop['phone'])<div class="muted">Tel: {{ $shop['phone'] }}</div>@endif
        @if ($shop['email'])<div class="muted">{{ $shop['email'] }}</div>@endif
    </div>

    @if ($sale->status === 'voided')
        <div class="void">VOIDED</div>
    @endif

    <div class="rule"></div>
    <table>
        <tr><td>{{ $sale->document_type === 'invoice' ? 'Invoice' : 'Receipt' }}</td><td class="right bold">{{ $sale->receipt_no }}</td></tr>
        <tr><td>Date</td><td class="right">{{ $sale->created_at->format('d/m/Y H:i') }}</td></tr>
        <tr><td>Cashier</td><td class="right">{{ $sale->cashier_name ?: '-' }}</td></tr>
        <tr><td>Customer</td><td class="right">{{ $sale->customer_name ?: 'Walk-in customer' }}</td></tr>
    </table>
    <div class="rule"></div>

    <table>
        @foreach ($sale->items as $item)
            <tr><td colspan="2" class="item-name bold">{{ $item->option_label ?: $item->product_name }}</td></tr>
            <tr>
                <td class="muted">
                    @if ($item->packs)
                        {{ $qty($item->packs) }} x {{ $money($item->unit_price) }}
                    @else
                        {{ $qty($item->quantity) }} {{ $item->product_unit }} x {{ $money($item->unit_price) }}
                    @endif
                </td>
                <td class="right">{{ $money($item->line_total) }}</td>
            </tr>
        @endforeach
    </table>
    <div class="rule"></div>

    <table>
        <tr><td>Subtotal</td><td class="right">{{ $money($sale->subtotal) }}</td></tr>
        @if ($sale->discount > 0)
            <tr><td>Discount</td><td class="right">-{{ $money($sale->discount) }}</td></tr>
        @endif
        <tr class="total"><td>TOTAL (RM)</td><td class="right">{{ $money($sale->total) }}</td></tr>
    </table>
    <div class="rule"></div>

    <table>
        @if ($sale->payment_method === 'Cash' && $sale->amount_tendered !== null && $sale->payments->count() === 1)
            <tr><td>Cash</td><td class="right">{{ $money($sale->amount_tendered) }}</td></tr>
            @if ($sale->change_due > 0)
                <tr><td>Change</td><td class="right">{{ $money($sale->change_due) }}</td></tr>
            @endif
        @else
            @foreach ($sale->payments as $payment)
                <tr>
                    <td>{{ $payment->method }} <span class="muted">{{ $payment->payment_date->format('d/m') }}</span></td>
                    <td class="right">{{ $money($payment->amount) }}</td>
                </tr>
            @endforeach
            @if ($sale->payments->isEmpty())
                <tr><td>Paid</td><td class="right">0.00</td></tr>
            @endif
        @endif
        @if ($sale->payment_reference)
            <tr><td>Ref</td><td class="right">{{ $sale->payment_reference }}</td></tr>
        @endif
        @if ($sale->balance_due > 0)
            <tr class="total"><td>BALANCE DUE</td><td class="right">{{ $money($sale->balance_due) }}</td></tr>
            @if ($sale->due_date)<tr><td>Due by</td><td class="right">{{ $sale->due_date->format('d/m/Y') }}</td></tr>@endif
        @endif
        <tr><td>Items</td><td class="right">{{ $qty($sale->items->sum('quantity')) }}</td></tr>
    </table>

    @if ($sale->status === 'voided')
        <div class="rule"></div>
        <div>Voided {{ $sale->voided_at?->format('d/m/Y H:i') }} by {{ $sale->voided_by }}</div>
        <div>Reason: {{ $sale->void_reason }}</div>
    @endif

    @if ($sale->notes)
        <div class="rule"></div>
        <div>{{ $sale->notes }}</div>
    @endif

    <div class="rule"></div>
    <div class="center">{{ $shop['receipt_footer'] }}</div>
    <div class="center">soipos 2026</div>
</body>
</html>
