<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $sale->receipt_no }}</title>
    @php
        $money = fn ($v) => number_format((float) $v, 2);
        $qty = fn ($v) => rtrim(rtrim(number_format((float) $v, 4, '.', ','), '0'), '.');
        $date = fn ($v) => $v ? \Illuminate\Support\Carbon::parse($v)->format('d/m/Y') : '-';
        $voided = $sale->status === 'voided';
        $statusLabel = $voided ? 'VOID' : match ($sale->payment_status) {
            'paid' => 'PAID',
            'partial' => 'PARTIALLY PAID',
            default => $sale->is_overdue ? 'OVERDUE' : 'UNPAID',
        };
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
        @page { margin: 40px; }
        body { color: #0a0a0a; font-family: "Inter", sans-serif; font-size: 10px; line-height: 1.45; }
        .muted { color: #737373; }
        .bold { font-weight: bold; }
        .right { text-align: right; }
        table { border-collapse: collapse; width: 100%; }
        td, th { vertical-align: top; }
        .top td { padding: 0; }
        .store { font-size: 18px; font-weight: bold; }
        .title { font-size: 26px; font-weight: bold; letter-spacing: 2px; }
        .status { border: 1.5px solid #0a0a0a; display: inline-block; font-size: 10px; font-weight: bold; letter-spacing: 1px; margin-top: 6px; padding: 3px 8px; }
        .rule { border-top: 2px solid #0a0a0a; margin: 18px 0 14px; }
        .label { color: #737373; font-size: 8px; font-weight: bold; letter-spacing: .5px; text-transform: uppercase; }
        .meta td { padding: 2px 0; }
        .items { margin-top: 22px; }
        .items th { border-bottom: 1.5px solid #0a0a0a; font-size: 8px; padding: 6px 6px; text-align: left; text-transform: uppercase; }
        .items td { border-bottom: 1px solid #e5e5e5; padding: 8px 6px; }
        .totals { margin-top: 10px; }
        .totals td { padding: 4px 6px; }
        .totals .grand td { border-top: 1.5px solid #0a0a0a; font-size: 13px; font-weight: bold; padding-top: 8px; }
        .totals .due td { background: #0a0a0a; color: #fff; font-size: 12px; font-weight: bold; padding: 8px 6px; }
        .section { margin-top: 26px; }
        .payments td, .payments th { border-bottom: 1px solid #e5e5e5; padding: 5px 6px; text-align: left; }
        .payments th { font-size: 8px; text-transform: uppercase; }
        .payments td.right, .payments th.right { text-align: right; }
        .footer { border-top: 1px solid #e5e5e5; color: #737373; font-size: 8px; margin-top: 30px; padding-top: 8px; text-align: center; }
        .void-mark { color: #f0f0f0; font-size: 160px; font-weight: bold; left: 0; letter-spacing: 20px; position: fixed; text-align: center; top: 300px; width: 100%; z-index: -1; }
    </style>
</head>
<body>
    @if ($voided)<div class="void-mark">VOID</div>@endif

    <table class="top">
        <tr>
            <td style="width: 60%">
                <div class="store">{{ $shop['store_name'] }}</div>
                @if ($shop['company_name'])
                    <div class="bold">{{ $shop['company_name'] }}@if ($shop['company_reg_no']) <span class="muted" style="font-weight: normal">({{ $shop['company_reg_no'] }})</span>@endif</div>
                @endif
                @if ($shop['address'])<div class="muted">{!! nl2br(e($shop['address'])) !!}</div>@endif
                <div class="muted">
                    @if ($shop['phone'])Tel: {{ $shop['phone'] }}@endif
                    @if ($shop['phone'] && $shop['email']) &middot; @endif
                    @if ($shop['email']){{ $shop['email'] }}@endif
                </div>
            </td>
            <td class="right" style="width: 40%">
                <div class="title">INVOICE</div>
                <div class="status">{{ $statusLabel }}</div>
            </td>
        </tr>
    </table>

    <div class="rule"></div>

    <table>
        <tr>
            <td style="width: 55%">
                <div class="label">Bill to</div>
                <div class="bold" style="font-size: 12px">{{ $sale->customer_company ?: $sale->customer_name }}</div>
                @if ($sale->customer_company && $sale->customer_name)<div>Attn: {{ $sale->customer_name }}</div>@endif
                @if ($sale->customer_address)<div>{!! nl2br(e($sale->customer_address)) !!}</div>@endif
                @if ($sale->customer_phone)<div class="muted">Tel: {{ $sale->customer_phone }}</div>@endif
                @if ($sale->customer_email)<div class="muted">{{ $sale->customer_email }}</div>@endif
            </td>
            <td style="width: 45%">
                <table class="meta">
                    <tr><td class="label">Invoice no.</td><td class="right bold">{{ $sale->receipt_no }}</td></tr>
                    <tr><td class="label">Invoice date</td><td class="right">{{ $date($sale->sale_date) }}</td></tr>
                    <tr><td class="label">Due date</td><td class="right">{{ $date($sale->due_date ?? $sale->sale_date) }}</td></tr>
                    @if ($sale->cashier_name)<tr><td class="label">Issued by</td><td class="right">{{ $sale->cashier_name }}</td></tr>@endif
                    <tr><td class="label">Balance due</td><td class="right bold">{{ $voided ? '—' : 'RM ' . $money($sale->balance_due) }}</td></tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 5%">#</th>
                <th>Description</th>
                <th class="right" style="width: 14%">Qty</th>
                <th class="right" style="width: 16%">Unit price (RM)</th>
                <th class="right" style="width: 16%">Amount (RM)</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($sale->items as $i => $item)
                <tr>
                    <td class="muted">{{ $i + 1 }}</td>
                    <td>
                        <div class="bold">{{ $item->product_name }}</div>
                        @if ($item->product_sku_code)<div class="muted">SKU {{ $item->product_sku_code }}</div>@endif
                    </td>
                    <td class="right">{{ $qty($item->quantity) }} {{ $item->product_unit }}</td>
                    <td class="right">{{ $money($item->unit_price) }}</td>
                    <td class="right">{{ $money($item->line_total) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td style="width: 55%"></td>
            <td>Subtotal</td>
            <td class="right">{{ $money($sale->subtotal) }}</td>
        </tr>
        @if ($sale->discount > 0)
            <tr><td></td><td>Discount</td><td class="right">-{{ $money($sale->discount) }}</td></tr>
        @endif
        <tr class="grand"><td></td><td>Total (RM)</td><td class="right">{{ $money($sale->total) }}</td></tr>
        <tr><td></td><td>Amount paid</td><td class="right">{{ $money($sale->amount_paid) }}</td></tr>
        <tr class="due"><td style="background: #fff"></td><td>Balance due (RM)</td><td class="right">{{ $voided ? 'VOID' : $money($sale->balance_due) }}</td></tr>
    </table>

    @if ($sale->payments->isNotEmpty())
        <div class="section">
            <div class="label" style="margin-bottom: 4px">Payments received</div>
            <table class="payments">
                <tr><th>Date</th><th>Method</th><th>Reference</th><th class="right">Amount (RM)</th></tr>
                @foreach ($sale->payments as $payment)
                    <tr>
                        <td>{{ $date($payment->payment_date) }}</td>
                        <td>{{ $payment->method }}</td>
                        <td>{{ $payment->reference ?: '-' }}</td>
                        <td class="right">{{ $money($payment->amount) }}</td>
                    </tr>
                @endforeach
            </table>
        </div>
    @endif

    @if ($sale->notes)
        <div class="section">
            <div class="label">Notes</div>
            <div>{!! nl2br(e($sale->notes)) !!}</div>
        </div>
    @endif

    @if ($voided)
        <div class="section">
            <div class="label">Voided</div>
            <div>{{ $sale->voided_at?->format('d/m/Y H:i') }} by {{ $sale->voided_by }} — {{ $sale->void_reason }}</div>
        </div>
    @endif

    <div class="footer">
        {{ $shop['receipt_footer'] }}<br>
        This is a computer-generated invoice. Generated on {{ now()->format('d/m/Y H:i') }}.
    </div>
</body>
</html>
