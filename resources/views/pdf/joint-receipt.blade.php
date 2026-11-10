<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Receipt {{ $sales->pluck('receipt_no')->join(' + ') }}</title>
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
        .store { background: #000; color: #fff; font-weight: bold; margin-top: 6px; padding: 2px 4px; }
        .total td { font-size: 11px; font-weight: bold; padding-top: 3px; }
        .void { border: 1px solid #000; font-weight: bold; margin: 3px 0; padding: 2px; text-align: center; }
    </style>
</head>
<body>
    <div class="center">
        <div class="shop">{{ $shop['store_name'] }}</div>
        @if ($shop['company_name'])<div>{{ $shop['company_name'] }}@if ($shop['company_reg_no']) <span class="muted">({{ $shop['company_reg_no'] }})</span>@endif</div>@endif
        @if ($shop['address'])<div class="muted">{!! nl2br(e($shop['address'])) !!}</div>@endif
        @if ($shop['phone'])<div class="muted">Tel: {{ $shop['phone'] }}</div>@endif
        @if ($shop['email'])<div class="muted">{{ $shop['email'] }}</div>@endif
        <div class="bold" style="margin-top: 3px">Joint sale &middot; paid to {{ $shop['store_name'] }}</div>
    </div>

    <div class="rule"></div>
    <table>
        <tr><td>Date</td><td class="right">{{ $first->created_at->format('d/m/Y H:i') }}</td></tr>
        <tr><td>Cashier</td><td class="right">{{ $first->cashier_name ?: '-' }}</td></tr>
        <tr><td>Customer</td><td class="right">{{ $first->customer_name ?: 'Walk-in customer' }}</td></tr>
    </table>

    @foreach ($sales as $sale)
        @php $store = $stores->get($sale->store_id); @endphp
        <div class="store">{{ $store?->name }}@if ($store?->short_code) ({{ $store->short_code }})@endif</div>
        <table>
            <tr><td>Receipt</td><td class="right bold">{{ $sale->receipt_no }}</td></tr>
        </table>
        @if ($sale->status === 'voided')
            <div class="void">VOIDED</div>
        @endif
        <table>
            @foreach ($sale->items as $item)
                <tr><td colspan="2" class="item-name bold">{{ $item->option_label ?: trim($item->product_name.' '.$item->product_size) }}</td></tr>
                <tr>
                    <td class="muted">{{ $qty($item->quantity) }}{{ strtolower((string) $item->product_unit) === 'kg' ? ' kg' : '' }} x {{ $money($item->unit_price) }}{{ strtolower((string) $item->product_unit) === 'kg' ? '/kg' : '' }}</td>
                    <td class="right">{{ $money($item->line_total) }}</td>
                </tr>
            @endforeach
            <tr><td class="bold" style="padding-top: 3px">Subtotal</td><td class="right bold" style="padding-top: 3px">{{ $money($sale->total) }}</td></tr>
        </table>
    @endforeach

    <div class="rule"></div>
    <table>
        <tr class="total"><td>TOTAL (RM)</td><td class="right">{{ $money($total) }}</td></tr>
        @if ($tendered !== null)
            <tr><td>Cash</td><td class="right">{{ $money($tendered) }}</td></tr>
            @if ($change > 0)
                <tr><td>Change</td><td class="right">{{ $money($change) }}</td></tr>
            @endif
        @else
            <tr><td>{{ $first->payment_method }}</td><td class="right">{{ $money($total) }}</td></tr>
        @endif
        @if ($first->payment_reference)
            <tr><td>Ref</td><td class="right">{{ $first->payment_reference }}</td></tr>
        @endif
        <tr><td>Items</td><td class="right">{{ $qty($sales->sum(fn ($s) => $s->items->sum(fn ($i) => strtolower((string) $i->product_unit) === 'kg' ? 1 : $i->quantity))) }}</td></tr>
    </table>

    <div class="rule"></div>
    <div class="center">{{ $shop['receipt_footer'] }}</div>
    <div class="center">soipos 2026</div>
</body>
</html>
