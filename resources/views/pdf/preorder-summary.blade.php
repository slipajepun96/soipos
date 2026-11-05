<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Packing summary — {{ $session->name }}</title>
    @php
        $money = fn ($v) => number_format((float) $v, 2);
        $qty = fn ($v) => rtrim(rtrim(number_format((float) $v, 4, '.', ','), '0'), '.');
        $items = collect($summary['items'])->where('pending_units', '>', 0)->values();
    @endphp
    <style>
        @font-face {
            font-family: "Inter";
            src: url("{{ resource_path('font/Inter-VariableFont_opsz,wght.ttf') }}") format("truetype");
            font-weight: 400;
        }
        @font-face {
            font-family: "Inter";
            src: url("{{ resource_path('font/Inter-Bold.ttf') }}") format("truetype");
            font-weight: 700;
        }
        @page { margin: 28px; }
        body { color: #0a0a0a; font-family: "Inter", sans-serif; font-size: 10px; line-height: 1.35; }
        table { border-collapse: collapse; width: 100%; }
        td, th { vertical-align: top; }
        .muted { color: #737373; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        h1 { font-size: 18px; margin: 0; }
        h2 { font-size: 11px; letter-spacing: .5px; margin: 18px 0 6px; text-transform: uppercase; }
        .label { color: #737373; font-size: 7.5px; font-weight: bold; letter-spacing: .5px; text-transform: uppercase; }
        .meta td { padding: 8px 0 0; }
        .grid th { border-bottom: 1px solid #0a0a0a; font-size: 7.5px; padding: 5px 4px; text-align: left; text-transform: uppercase; }
        .grid td { border-bottom: 1px solid #e5e5e5; padding: 6px 4px; }
        .grid th.right, .grid td.right { text-align: right; }
        .grid th.center, .grid td.center { text-align: center; }
        .grid tfoot td { border-bottom: 0; border-top: 1px solid #0a0a0a; font-weight: bold; }
        .big { font-size: 14px; font-weight: bold; }
        .box { border: 1.5px solid #0a0a0a; display: inline-block; height: 9px; width: 9px; }
        .short { font-weight: bold; text-decoration: underline; }
        .checklist td { font-size: 9.5px; }
        .stats td { border: 1px solid #e5e5e5; padding: 6px 8px; width: 25%; }
    </style>
</head>
<body>
    <table>
        <tr>
            <td>
                <div class="label">{{ $shop['store_name'] }} · Packing summary</div>
                <h1>{{ $session->name }}</h1>
            </td>
            <td class="right muted">Printed {{ now()->format('d/m/Y H:i') }}</td>
        </tr>
    </table>
    <table class="meta">
        <tr>
            <td style="width: 33%"><div class="label">Pickup</div>{{ $session->pickup_date?->format('D, d/m/Y') ?? '—' }}@if ($session->pickup_time), {{ $session->pickup_time }}@endif</td>
            <td><div class="label">Location</div>{{ $session->pickup_location ?: '—' }}</td>
        </tr>
    </table>

    <table class="stats" style="margin-top: 12px">
        <tr>
            <td><div class="label">Orders to pack</div><div class="big">{{ $orders->count() }}</div></td>
            <td><div class="label">Units to pack</div><div class="big">{{ $items->sum('pending_units') }}</div></td>
            <td><div class="label">To collect</div><div class="big">RM {{ $money($orders->sum('total')) }}</div></td>
            <td><div class="label">Already collected</div><div class="big">{{ collect($summary['items'])->sum('collected_units') }} units</div></td>
        </tr>
    </table>

    <h2>What to pack</h2>
    <table class="grid">
        <thead>
            <tr>
                <th style="width: 18px"></th>
                <th>Item</th>
                <th class="right">Orders</th>
                <th class="right">Units</th>
                <th class="right">Stock needed</th>
                <th class="right">Value (RM)</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($items as $item)
                <tr>
                    <td><span class="box"></span></td>
                    <td><span class="bold">{{ $item['label'] }}</span> <span class="muted">· {{ $item['tracked'] ? $item['product_name'] : 'Custom item' }}</span></td>
                    <td class="right">{{ $item['orders'] }}</td>
                    <td class="right big">{{ $item['pending_units'] }}</td>
                    <td class="right">{!! $item['tracked'] ? e($qty($item['stock_needed']) . ' ' . $item['product_unit']) : '<span class="muted">Not tracked</span>' !!}</td>
                    <td class="right">{{ $money($item['pending_units'] * $item['price']) }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="center muted">Nothing left to pack.</td></tr>
            @endforelse
        </tbody>
    </table>

    @php $products = collect($summary['products'])->where('needed', '>', 0)->values(); @endphp
    @if ($products->isNotEmpty())
        <h2>Stock check</h2>
        <table class="grid">
            <thead>
                <tr>
                    <th>Product</th>
                    <th class="right">Needed</th>
                    <th class="right">In stock</th>
                    <th class="right">Short</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($products as $row)
                    <tr>
                        <td class="bold">{{ $row['product_name'] }}</td>
                        <td class="right">{{ $qty($row['needed']) }} {{ $row['product_unit'] }}</td>
                        <td class="right">{{ $qty($row['on_hand']) }} {{ $row['product_unit'] }}</td>
                        <td class="right {{ $row['short'] > 0 ? 'short' : 'muted' }}">{{ $row['short'] > 0 ? $qty($row['short']) . ' ' . $row['product_unit'] : '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if ($orders->isNotEmpty())
        <h2>Per customer</h2>
        <table class="grid checklist">
            <thead>
                <tr>
                    <th style="width: 18px"></th>
                    <th style="width: 62px">Order</th>
                    <th style="width: 120px">Customer</th>
                    @foreach ($items as $item)
                        <th class="center">{{ $item['label'] }}</th>
                    @endforeach
                    <th class="right" style="width: 60px">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($orders as $order)
                    @php $units = $order->lines->groupBy('preorder_session_item_id')->map->sum('quantity'); @endphp
                    <tr>
                        <td><span class="box"></span></td>
                        <td>{{ $order->order_no }}</td>
                        <td><span class="bold">{{ $order->customer_name }}</span><br><span class="muted">{{ $order->customer_phone }}</span></td>
                        @foreach ($items as $item)
                            <td class="center {{ ($units[$item['id']] ?? 0) ? 'bold' : 'muted' }}">{{ $units[$item['id']] ?? '·' }}</td>
                        @endforeach
                        <td class="right">{{ $money($order->total) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3">Total</td>
                    @foreach ($items as $item)
                        <td class="center">{{ $item['pending_units'] }}</td>
                    @endforeach
                    <td class="right">{{ $money($orders->sum('total')) }}</td>
                </tr>
            </tfoot>
        </table>
    @endif
</body>
</html>
