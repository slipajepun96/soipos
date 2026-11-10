<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Event report {{ $event->name }}</title>
    @php
        $money = fn ($v) => number_format((float) $v, 2);
        $qty = fn ($v) => rtrim(rtrim(number_format((float) $v, 4, '.', ','), '0'), '.');
        $date = fn ($v) => $v ? \Illuminate\Support\Carbon::parse($v)->format('d/m/Y') : '-';
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
        @page { margin: 36px; }
        body { color: #0a0a0a; font-family: "Inter", sans-serif; font-size: 9.5px; line-height: 1.4; }
        .muted { color: #737373; }
        .bold { font-weight: bold; }
        .right { text-align: right; }
        table { border-collapse: collapse; width: 100%; }
        td, th { vertical-align: top; }
        h1 { font-size: 20px; margin: 0; }
        h2 { border-bottom: 1.5px solid #0a0a0a; font-size: 11px; margin: 20px 0 6px; padding-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
        .rule { border-top: 2px solid #0a0a0a; margin: 10px 0 12px; }
        .label { color: #737373; font-size: 7.5px; font-weight: bold; letter-spacing: .5px; text-transform: uppercase; }
        .stats td { border: 1px solid #e5e5e5; padding: 8px; width: 25%; }
        .stats .value { font-size: 14px; font-weight: bold; margin-top: 2px; }
        .list th { border-bottom: 1px solid #0a0a0a; font-size: 7.5px; padding: 5px; text-align: left; text-transform: uppercase; }
        .list td { border-bottom: 1px solid #eeeeee; padding: 5px; }
        .list th.right, .list td.right { text-align: right; }
        .list tfoot td { border-bottom: 0; border-top: 1px solid #0a0a0a; font-weight: bold; }
        .two td.col { padding-right: 14px; width: 50%; }
        .footer { color: #737373; font-size: 7.5px; margin-top: 20px; text-align: center; }
    </style>
</head>
<body>
    <table>
        <tr>
            <td>
                <div class="label">Event report</div>
                <h1>{{ $event->name }}</h1>
                <div class="muted">
                    {{ $date($event->start_date) }}@if ($event->end_date && $event->end_date != $event->start_date) – {{ $date($event->end_date) }}@endif
                    @if ($event->location) · {{ $event->location }}@endif
                </div>
            </td>
            <td class="right">
                <div class="bold">{{ $shop['store_name'] }}</div>
                <div class="muted">{{ $shop['company_name'] }}</div>
            </td>
        </tr>
    </table>
    <div class="rule"></div>

    <table class="stats">
        <tr>
            <td><div class="label">Net sales</div><div class="value">RM {{ $money($summary['net']) }}</div></td>
            <td><div class="label">Transactions</div><div class="value">{{ $summary['count'] }}</div><div class="muted">Avg RM {{ $money($summary['average']) }}</div></td>
            <td><div class="label">Items sold</div><div class="value">{{ $qty($summary['items_sold']) }}</div></td>
            <td><div class="label">Gross profit</div><div class="value">RM {{ $money($summary['profit']) }}</div><div class="muted">{{ $summary['margin'] }}% margin</div></td>
        </tr>
        <tr>
            <td><div class="label">Discounts</div><div class="value">RM {{ $money($summary['discount']) }}</div></td>
            <td><div class="label">Cost of goods</div><div class="value">RM {{ $money($summary['cost']) }}</div></td>
            <td><div class="label">Collected</div><div class="value">RM {{ $money($summary['collected']) }}</div></td>
            <td><div class="label">Outstanding</div><div class="value">RM {{ $money($summary['outstanding']) }}</div>@if ($summary['voided'])<div class="muted">{{ $summary['voided'] }} voided (RM {{ $money($summary['voided_total']) }})</div>@endif</td>
        </tr>
    </table>

    <table class="two">
        <tr>
            <td class="col">
                <h2>By payment method</h2>
                <table class="list">
                    <thead><tr><th>Method</th><th class="right">Payments</th><th class="right">Amount (RM)</th></tr></thead>
                    <tbody>
                        @foreach ($by_method as $m)
                            <tr><td>{{ $m['method'] }}</td><td class="right">{{ $m['count'] }}</td><td class="right">{{ $money($m['total']) }}</td></tr>
                        @endforeach
                    </tbody>
                    <tfoot><tr><td>Total</td><td class="right">{{ collect($by_method)->sum('count') }}</td><td class="right">{{ $money($summary['collected']) }}</td></tr></tfoot>
                </table>
            </td>
            <td class="col" style="padding-right: 0">
                <h2>By day</h2>
                <table class="list">
                    <thead><tr><th>Date</th><th class="right">Sales</th><th class="right">Net (RM)</th></tr></thead>
                    <tbody>
                        @forelse ($by_day as $d)
                            <tr><td>{{ $date($d['date']) }}</td><td class="right">{{ $d['count'] }}</td><td class="right">{{ $money($d['net']) }}</td></tr>
                        @empty
                            <tr><td colspan="3" class="muted">No sales.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </td>
        </tr>
    </table>

    @if (! empty($joint) && $joint['role'] === 'host')
        @php $methods = collect($joint['collected_by_method'])->filter(fn ($v) => $v > 0)->keys(); @endphp
        <h2>Joint event settlement</h2>
        <div class="muted" style="margin-bottom: 4px">Joint POS sales by store. All payments were collected by {{ $shop['store_name'] }}.</div>
        <table class="list">
            <thead>
                <tr>
                    <th>Store</th><th class="right">Sales</th>
                    @foreach ($methods as $m)<th class="right">{{ $m }}</th>@endforeach
                    <th class="right">Total (RM)</th><th class="right">Paid out (RM)</th><th class="right">Owed (RM)</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($joint['stores'] as $s)
                    <tr>
                        <td>{{ $s['store_name'] }}{{ $s['is_host'] ? ' (host)' : '' }}</td>
                        <td class="right">{{ $s['count'] }}</td>
                        @foreach ($methods as $m)<td class="right">{{ $money($s['by_method'][$m]) }}</td>@endforeach
                        <td class="right">{{ $money($s['total']) }}</td>
                        <td class="right">{{ $s['is_host'] ? '-' : $money($s['settled_amount'] ?? 0) }}</td>
                        <td class="right">{{ $s['is_host'] ? '-' : $money($s['balance']) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td>Collected</td><td></td>
                    @foreach ($methods as $m)<td class="right">{{ $money($joint['collected_by_method'][$m]) }}</td>@endforeach
                    <td class="right">{{ $money($joint['collected']) }}</td><td></td><td class="right">{{ $money($joint['balance']) }}</td>
                </tr>
            </tfoot>
        </table>
    @elseif (! empty($joint) && $joint['role'] === 'partner')
        <h2>Joint event</h2>
        <table class="list">
            <tbody>
                <tr><td>Hosted by</td><td class="right">{{ $joint['host']['name'] }}</td></tr>
                <tr><td>Collected by host for this store</td><td class="right">RM {{ $money($joint['owed']) }}</td></tr>
                <tr><td>Paid to this store</td><td class="right">RM {{ $money($joint['settled_amount'] ?? 0) }}{{ $joint['settled_at'] ? ' on '.$joint['settled_at']->format('d/m/Y') : '' }}</td></tr>
                <tr><td class="bold">Still owed</td><td class="right bold">RM {{ $money($joint['balance']) }}</td></tr>
            </tbody>
        </table>
    @endif

    <h2>Products sold</h2>
    <table class="list">
        <thead>
            <tr>
                <th>Product</th>
                <th class="right">Qty</th>
                <th class="right">Revenue (RM)</th>
                <th class="right">Cost (RM)</th>
                <th class="right">Profit (RM)</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($products as $p)
                <tr>
                    <td>{{ $p['product_name'] }}</td>
                    <td class="right">{{ $qty($p['quantity']) }}</td>
                    <td class="right">{{ $money($p['revenue']) }}</td>
                    <td class="right">{{ $money($p['cost']) }}</td>
                    <td class="right">{{ $money($p['profit']) }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="muted">No products sold.</td></tr>
            @endforelse
        </tbody>
        @if (count($products))
            <tfoot>
                <tr>
                    <td>Total (before order discounts)</td>
                    <td class="right">{{ $qty($summary['items_sold']) }}</td>
                    <td class="right">{{ $money(collect($products)->sum('revenue')) }}</td>
                    <td class="right">{{ $money($summary['cost']) }}</td>
                    <td class="right">{{ $money(collect($products)->sum('profit')) }}</td>
                </tr>
            </tfoot>
        @endif
    </table>

    <h2>Transactions</h2>
    <table class="list">
        <thead>
            <tr>
                <th>Date / time</th>
                <th>Number</th>
                <th>Customer</th>
                <th>Payment</th>
                <th class="right">Items</th>
                <th class="right">Total (RM)</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($sales as $s)
                <tr @if ($s->status === 'voided') class="muted" @endif>
                    <td>{{ $s->created_at->format('d/m/Y H:i') }}</td>
                    <td>{{ $s->receipt_no }}@if ($s->status === 'voided') (void)@endif</td>
                    <td>{{ $s->customer_company ?: $s->customer_name }}</td>
                    <td>{{ $s->payment_method ?: 'Pay later' }}</td>
                    <td class="right">{{ $s->items_count }}</td>
                    <td class="right">@if ($s->status === 'voided')<s>{{ $money($s->total) }}</s>@else{{ $money($s->total) }}@endif</td>
                </tr>
            @empty
                <tr><td colspan="6" class="muted">No transactions.</td></tr>
            @endforelse
        </tbody>
    </table>

    @if ($event->notes)
        <h2>Notes</h2>
        <div>{!! nl2br(e($event->notes)) !!}</div>
    @endif

    <div class="footer">Generated on {{ now()->format('d/m/Y H:i') }}</div>
</body>
</html>
