<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    @php
    $titles = [
        'GRN' => 'Goods Received Note',
        'Opening Stock' => 'Opening Stock Note',
        'SOD' => 'Stock Out Document',
        'Sales Invoice' => 'Sales Invoice',
        'Stock Adjustment' => 'Stock Adjustment Note',
        'Item Disposal Note' => 'Item Disposal Note',
    ];
    $partyLabels = [
        'GRN' => 'Supplier',
        'Opening Stock' => 'Supplier',
        'SOD' => 'Recipient',
        'Sales Invoice' => 'Customer',
        'Stock Adjustment' => 'Source',
        'Item Disposal Note' => 'Source',
    ];
    $docType = $stock_doc->stock_doc_type;
    $docTitle = $titles[$docType] ?? $docType;
    $partyLabel = $partyLabels[$docType] ?? 'Party';
    $isInvoice = $docType === 'Sales Invoice';
    $isAdjustment = $docType === 'Stock Adjustment';
    $hasContact = in_array($docType, ['GRN', 'Opening Stock'], true);
    $columns = 6 + ($isInvoice ? 2 : 0) + ($isAdjustment ? 1 : 0);
@endphp
    <title>{{ $docTitle }} {{ $stock_doc->stock_doc_num }}</title>
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
        body { color: #0a0a0a; font-family: "Inter", sans-serif; font-size: 11px; }
        h1 { color: #0a0a0a; font-size: 22px; margin: 0; }
        .subtitle { color: #737373; margin-top: 4px; }
        .letterhead { display: block; height: auto; margin-bottom: 16px; width: 100%; }
        .header { border-top: 2px solid #0a0a0a; display: table; margin-bottom: 10px; padding-bottom: 2px; width: 100%; }
        .header h1 { display: table-cell; }
        .header h1:last-child { text-align: right; }
        .meta { margin: 2px 0; width: 100%; }
        .meta td { padding: 5px 8px 5px 0; vertical-align: top; width: 50%; }
        .label { color: #737373; font-size: 9px; font-weight: bold; text-transform: uppercase; }
        .value { font-weight: bold; margin-top: 3px; }
        .big-size-value { font-weight: bold; font-size: 15px; margin-top: 3px; }
        table.items { border-collapse: collapse; margin-top: 18px; width: 100%; }
        .items th { background: #f5f5f5; color: #262626; text-align: left; }
        .items th, .items td { border: 1px solid #e5e5e5; padding: 8px; }
        .number { text-align: right !important; }
        .total-row td { background: #fafafa; font-weight: bold; }
        .signatures { margin-top: 48px; width: 100%; }
        .signatures td { padding-right: 28px; vertical-align: bottom; width: 50%; }
        .signature-space { height: 48px; }
        .signature-line { border-top: 1px solid #0a0a0a; padding-top: 6px; }
        .remarks { margin-top: 20px; }
        .footer { color: #647067; font-size: 9px; margin-top: 28px; }
    </style>
</head>
<body>
    <img class="letterhead" src="{{ public_path('img/web-letterhead-long.png') }}" alt="Letterhead">
    <div class="header">
        <h1>{{ $docTitle }}</h1>
        <h1>{{ $stock_doc->stock_doc_num }}</h1>
    </div>
    <table class="meta">
        <tr>
            <!-- <td>
                <div class="big-size-value">{{ $stock_doc->stock_doc_num }}</div>
            </td> -->
            <td>
                <div class="label">Date</div>
                <div class="value">{{ $stock_doc->stock_doc_date ? date('d/m/Y', strtotime($stock_doc->stock_doc_date)) : '-' }}</div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="label">{{ $partyLabel }}</div>
                <div class="value">{{ $stock_doc->stock_doc_supplier_name }}</div>
                <div>{{ $stock_doc->stock_doc_supplier_rob_num }}</div>
            </td>
            @if ($hasContact)
            <td>
                <div class="label">Contact</div>
                <div>{{ $stock_doc->stock_doc_supplier_phone_num ?: '-' }}</div>
                <div>{{ $stock_doc->stock_doc_supplier_email ?: '' }}</div>
            </td>
            @endif
        </tr>
        <tr>
            @if ($hasContact)
            <td>
                <div class="label">Address</div>
                <div>{{ $stock_doc->stock_doc_supplier_address ?: '-' }}</div>
            </td>
            @endif
            @if ($stock_doc->transportation_mode)
            <td>
                <div class="label">Transportation</div>
                <div>{{ $stock_doc->transportation_mode }}</div>
            </td>
            @endif
            <!-- <td>
                <div class="label">Status</div>
                <div class="value">{{ ucfirst($stock_doc->verified_status ?: 'pending') }}</div>
            </td> -->
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>#</th>
                <th>Product</th>
                @if ($isAdjustment)<th>Direction</th>@endif
                <th class="number">Quantity</th>
                <th class="number">Unit Cost (RM)</th>
                <th class="number">Cost (RM)</th>
                @if ($isInvoice)
                <th class="number">Price (RM)</th>
                <th class="number">Amount (RM)</th>
                @endif
                <th>Expiry Date</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($stocks as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->stock_product_name }}<br><span class="subtitle">{{ $item->stock_number_of_measure }} {{ $item->stock_product_unit }}</span></td>
                    @if ($isAdjustment)<td>{{ $item->stock_entry_type === 'in' ? 'Increase' : 'Decrease' }}</td>@endif
                    <td class="number">{{ number_format((float) $item->stock_quantity, 2) }}</td>
                    <td class="number">{{ number_format((float) $item->stock_unit_cost, 2) }}</td>
                    <td class="number">{{ number_format((float) $item->stock_total_cost, 2) }}</td>
                    @if ($isInvoice)
                    <td class="number">{{ number_format((float) $item->stock_unit_sales_price, 2) }}</td>
                    <td class="number">{{ number_format((float) $item->stock_total_sales_price, 2) }}</td>
                    @endif
                    <td>{{ $item->stock_expiry_date ? date('d/m/Y', strtotime($item->stock_expiry_date)) : '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="{{ $columns }}">No stock items recorded.</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="{{ $isAdjustment ? 5 : 4 }}" class="number">{{ $isAdjustment ? 'Net Cost Change' : 'Total Cost' }}</td>
                <td class="number">{{ number_format((float) $stock_doc->stock_doc_total_cost, 2) }}</td>
                @if ($isInvoice)
                <td class="number">Invoice Total</td>
                <td class="number">{{ number_format((float) $stock_doc->stock_doc_total_sales_price, 2) }}</td>
                @endif
                <td></td>
            </tr>
        </tfoot>
    </table>
    <div class="footer">Generated on {{ now()->format('d/m/Y H:i') }}</div>

    <table class="signatures">
        <tr>
            <td>
                <div class="signature-space"></div>
                <div class="signature-line">Checked By</div>
            </td>
            <td>
                <div class="signature-space"></div>
                <div class="signature-line">Certified By</div>
            </td>
        </tr>
    </table>

    @if ($stock_doc->remarks)
        <div class="remarks"><span class="label">Remarks</span><br>{{ $stock_doc->remarks }}</div>
    @endif
</body>
</html>
