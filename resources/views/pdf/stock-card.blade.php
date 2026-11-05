<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Stock Card {{ $product->product_name }}</title>
    @php
        $qty = fn ($v) => rtrim(rtrim(number_format((float) $v, 4, '.', ','), '0'), '.');
        $date = fn ($v) => $v ? date('d/m/Y', strtotime($v)) : '-';
        $unit = $product->product_unit;
        $types = [
            'GRN' => 'GRN',
            'Opening Stock' => 'Opening',
            'SOD' => 'SOD',
            'Sales Invoice' => 'Invoice',
            'Stock Adjustment' => 'Adjustment',
            'Item Disposal Note' => 'Disposal',
        ];
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
        @page { margin: 32px; }
        body { color: #0a0a0a; font-family: "Inter", sans-serif; font-size: 10px; }
        h1 { color: #0a0a0a; font-size: 20px; margin: 0; }
        .muted { color: #737373; }
        .letterhead { display: block; height: auto; margin-bottom: 16px; width: 100%; }
        .header { border-top: 2px solid #0a0a0a; display: table; margin-bottom: 10px; padding-top: 6px; width: 100%; }
        .header h1 { display: table-cell; }
        .header .period { display: table-cell; text-align: right; vertical-align: bottom; }
        .meta { margin: 4px 0 8px; width: 100%; }
        .meta td { padding: 4px 8px 4px 0; vertical-align: top; }
        .label { color: #737373; font-size: 8px; font-weight: bold; text-transform: uppercase; }
        .value { font-weight: bold; margin-top: 2px; }
        .summary { border-collapse: collapse; margin: 6px 0 14px; width: 100%; }
        .summary td { border: 1px solid #e5e5e5; padding: 8px; width: 25%; }
        .summary .value { font-size: 14px; }
        table.items { border-collapse: collapse; width: 100%; }
        .items th { background: #f5f5f5; color: #262626; text-align: left; }
        .items th, .items td { border: 1px solid #e5e5e5; padding: 6px; }
        .items tbody tr { page-break-inside: avoid; }
        .number { text-align: right !important; }
        .bold { font-weight: bold; }
        .shade td { background: #fafafa; }
        .footer { color: #737373; font-size: 8px; margin-top: 16px; }
    </style>
</head>
<body>
    <img class="letterhead" src="{{ public_path('img/web-letterhead-long.png') }}" alt="Letterhead">

    <div class="header">
        <h1>Stock Card</h1>
        <div class="period muted">{{ $date($from) }} – {{ $date($to) }}</div>
    </div>

    <table class="meta">
        <tr>
            <td style="width: 50%">
                <div class="label">Product</div>
                <div class="value">{{ $product->product_name }}</div>
            </td>
            <td style="width: 25%">
                <div class="label">SKU</div>
                <div class="value">{{ $product->product_sku_code ?: '-' }}</div>
            </td>
            <td style="width: 25%">
                <div class="label">Unit</div>
                <div class="value">{{ $product->product_num_of_measure }} {{ $unit }}</div>
            </td>
        </tr>
    </table>

    <table class="summary">
        <tr>
            <td>
                <div class="label">Opening balance</div>
                <div class="value">{{ $qty($card['opening']) }} {{ $unit }}</div>
            </td>
            <td>
                <div class="label">Total in</div>
                <div class="value">{{ $qty($card['total_in']) }} {{ $unit }}</div>
            </td>
            <td>
                <div class="label">Total out</div>
                <div class="value">{{ $qty($card['total_out']) }} {{ $unit }}</div>
            </td>
            <td>
                <div class="label">Closing balance</div>
                <div class="value">{{ $qty($card['closing']) }} {{ $unit }}</div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Date</th>
                <th>Document</th>
                <th>Type</th>
                <th>Party / Remarks</th>
                <th class="number">In</th>
                <th class="number">Out</th>
                <th class="number">Unit Cost (RM)</th>
                <th class="number">Balance</th>
            </tr>
        </thead>
        <tbody>
            <tr class="shade">
                <td>{{ $date($from) }}</td>
                <td colspan="6" class="muted">Opening balance</td>
                <td class="number bold">{{ $qty($card['opening']) }}</td>
            </tr>
            @forelse ($card['movements'] as $m)
                <tr>
                    <td>{{ $date($m['date']) }}</td>
                    <td>{{ $m['doc_num'] }}</td>
                    <td>{{ $types[$m['doc_type']] ?? $m['doc_type'] }}</td>
                    <td>
                        {{ $m['party'] ?: '-' }}
                        @if ($m['remarks'])
                            <br><span class="muted">{{ $m['remarks'] }}</span>
                        @endif
                    </td>
                    <td class="number">{{ $m['in'] ? $qty($m['in']) : '' }}</td>
                    <td class="number">{{ $m['out'] ? $qty($m['out']) : '' }}</td>
                    <td class="number">{{ number_format($m['unit_cost'], 2) }}</td>
                    <td class="number bold">{{ $qty($m['balance']) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="muted" style="text-align: center; padding: 16px;">No movements in this period.</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr class="shade">
                <td colspan="4" class="bold">Closing balance</td>
                <td class="number bold">{{ $qty($card['total_in']) }}</td>
                <td class="number bold">{{ $qty($card['total_out']) }}</td>
                <td></td>
                <td class="number bold">{{ $qty($card['closing']) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="footer">Generated on {{ now()->format('d/m/Y H:i') }}</div>
</body>
</html>
