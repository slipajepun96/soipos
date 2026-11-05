<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Order slips — {{ $session->name }}</title>
    @php
        $money = fn ($v) => number_format((float) $v, 2);
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
        @page { margin: 22px; }
        body { color: #0a0a0a; font-family: "Inter", sans-serif; font-size: 10px; line-height: 1.35; }
        table { border-collapse: collapse; width: 100%; }
        td, th { vertical-align: top; }
        .muted { color: #737373; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .slip { border: 1.5px solid #0a0a0a; padding: 12px 14px; page-break-inside: avoid; }
        .cut { border-top: 1px dashed #a3a3a3; margin: 10px 0; }
        .shop { font-size: 8px; letter-spacing: .5px; text-transform: uppercase; }
        .order-no { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
        .name { font-size: 16px; font-weight: bold; }
        .phone { font-size: 13px; font-weight: bold; }
        .address { margin-top: 2px; }
        .label { color: #737373; font-size: 7.5px; font-weight: bold; letter-spacing: .5px; text-transform: uppercase; }
        .head td { padding-bottom: 8px; }
        .meta { border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; }
        .meta td { padding: 6px 0; }
        .items { margin-top: 6px; }
        .items th { border-bottom: 1px solid #0a0a0a; font-size: 7.5px; padding: 4px; text-align: left; text-transform: uppercase; }
        .items td { border-bottom: 1px solid #eeeeee; padding: 5px 4px; }
        .items th.right, .items td.right { text-align: right; }
        .qty { font-size: 13px; font-weight: bold; width: 50px; }
        .box { border: 1.5px solid #0a0a0a; display: inline-block; height: 9px; margin-right: 5px; vertical-align: middle; width: 9px; }
        .totals td { padding: 3px 4px; }
        .due td { font-size: 13px; font-weight: bold; }
        .stamp { border: 1.5px solid #0a0a0a; display: inline-block; font-size: 9px; font-weight: bold; letter-spacing: 1px; padding: 2px 6px; }
        .notes { background: #f5f5f5; margin-top: 6px; padding: 5px 7px; }
        .empty { color: #737373; padding: 40px; text-align: center; }
    </style>
</head>
<body>
    @forelse ($orders as $order)
        @php
            $location = $session->pickup_location;
        @endphp
        @if (!$loop->first)<div class="cut"></div>@endif
        <div class="slip">
            <table class="head">
                <tr>
                    <td style="width: 58%">
                        <div class="shop muted">{{ $shop['store_name'] }} · Pre-order</div>
                        <div class="name">{{ $order->customer_name }}</div>
                        <div class="phone">{{ $order->customer_phone }}</div>
                        @if ($order->customer_address)
                            <div class="address">{!! nl2br(e($order->customer_address)) !!}</div>
                        @endif
                    </td>
                    <td class="right">
                        <div class="order-no">{{ $order->order_no }}</div>
                        <div>
                            @if ($order->status === 'cancelled')
                                <span class="stamp">CANCELLED</span>
                            @elseif ($order->status === 'collected')
                                <span class="stamp">COLLECTED</span>
                            @else
                                <span class="stamp">TO PAY RM {{ $money($order->total) }}</span>
                            @endif
                        </div>
                        <div class="muted" style="margin-top: 4px">Ordered {{ $order->created_at->format('d/m/Y H:i') }}</div>
                    </td>
                </tr>
            </table>

            <table class="meta">
                <tr>
                    <td style="width: 30%">
                        <div class="label">Pickup</div>
                        <div class="bold">{{ $session->pickup_date?->format('D, d/m/Y') ?? '—' }}</div>
                        @if ($session->pickup_time)<div>{{ $session->pickup_time }}</div>@endif
                    </td>
                    <td style="width: 42%">
                        <div class="label">Location</div>
                        <div>{{ $location ?: '—' }}</div>
                    </td>
                    <td class="right">
                        <div class="label">Session</div>
                        <div>{{ $session->name }}</div>
                    </td>
                </tr>
            </table>

            <table class="items">
                <thead>
                    <tr>
                        <th style="width: 50px">Qty</th>
                        <th>Item</th>
                        <th class="right" style="width: 70px">Price (RM)</th>
                        <th class="right" style="width: 80px">Amount (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($order->lines as $line)
                        <tr>
                            <td class="qty"><span class="box"></span>{{ $line->quantity }}</td>
                            <td class="bold">{{ $line->label }}</td>
                            <td class="right">{{ $money($line->unit_price) }}</td>
                            <td class="right">{{ $money($line->line_total) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <table class="totals">
                <tr class="due">
                    <td style="width: 62%">
                        @if ($order->notes)
                            <div class="notes" style="font-size: 10px; font-weight: normal"><span class="label">Customer note</span><br>{{ $order->notes }}</div>
                        @endif
                    </td>
                    <td>Total</td>
                    <td class="right">RM {{ $money($order->total) }}</td>
                </tr>
            </table>
        </div>
    @empty
        <div class="empty">No orders to print.</div>
    @endforelse
</body>
</html>
