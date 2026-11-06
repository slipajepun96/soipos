import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { formatMoney, formatQty, formatUnits } from '@/lib/format';
import { cn } from '@/lib/utils';
import ProductCombobox from './ProductCombobox';
import DatePicker from './DatePicker';

let nextKey = 1;
export const emptyLine = () => ({
    key: nextKey++,
    product_id: '',
    quantity: '',
    unit_cost: '',
    sales_unit_price: '',
    expiry_date: '',
    counted_quantity: '',
});

/**
 * Editable table of document lines.
 *
 * mode:
 *  - 'in'    quantity + unit cost (+ expiry)      e.g. GRN, opening stock
 *  - 'out'   quantity limited by stock on hand    e.g. SOD, invoice, disposal
 *  - 'count' counted quantity vs system balance   e.g. stock adjustment
 */
export default function LineItemsEditor({
    mode,
    products,
    lines,
    onChange,
    available,
    showExpiry = false,
    showSalesPrice = false,
    errors = {},
}) {
    const productById = (id) => products.find((p) => String(p.id) === String(id));
    const update = (key, patch) => onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
    const remove = (key) => onChange(lines.length === 1 ? [emptyLine()] : lines.filter((line) => line.key !== key));
    const add = () => onChange([...lines, emptyLine()]);

    const pickedIds = lines.map((l) => l.product_id).filter(Boolean);
    // Blank lines are dropped before submit, so server error indexes count filled lines only.
    const payloadIndex = {};
    lines.filter((l) => l.product_id).forEach((l, i) => { payloadIndex[l.key] = i; });
    const err = (key, field) => (key in payloadIndex ? errors[`items.${payloadIndex[key]}.${field}`] : undefined);

    const totalCost = lines.reduce((sum, l) => sum + Number(l.quantity || 0) * Number(l.unit_cost || 0), 0);
    const totalSales = lines.reduce((sum, l) => sum + Number(l.quantity || 0) * Number(l.sales_unit_price || 0), 0);

    const headers = [
        { label: 'Product', className: 'min-w-64' },
        ...(mode === 'out' || mode === 'count' ? [{ label: 'On hand', className: 'text-right w-28' }] : []),
        ...(mode === 'count'
            ? [{ label: 'Counted', className: 'w-36' }, { label: 'Difference', className: 'text-right w-28' }]
            : [{ label: 'Quantity', className: 'w-32' }]),
        ...(mode === 'in' ? [{ label: 'Unit cost (RM)', className: 'w-36' }] : []),
        ...(showSalesPrice ? [{ label: 'Unit price (RM)', className: 'w-36' }] : []),
        ...(showExpiry ? [{ label: 'Expiry date', className: 'w-44' }] : []),
        ...(mode === 'in' || showSalesPrice ? [{ label: 'Amount (RM)', className: 'text-right w-32' }] : []),
        { label: '', className: 'w-12' },
    ];

    return (
        <div className="space-y-3">
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headers.map((h, i) => (
                                <TableHead key={i} className={h.className}>{h.label}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lines.map((line) => {
                            const product = productById(line.product_id);
                            const onHand = Number(available?.[line.product_id] || 0);
                            const overdrawn = mode === 'out' && line.product_id && Number(line.quantity || 0) > onHand;
                            const difference = line.counted_quantity === '' ? null : Number(line.counted_quantity) - onHand;

                            return (
                                <TableRow key={line.key} className="align-top hover:bg-transparent">
                                    <TableCell>
                                        <ProductCombobox
                                            products={products}
                                            value={line.product_id}
                                            available={mode === 'in' ? undefined : available}
                                            disabledIds={pickedIds}
                                            onChange={(p) => update(line.key, {
                                                product_id: p.id,
                                                sales_unit_price: line.sales_unit_price === '' && p.product_price ? p.product_price : line.sales_unit_price,
                                            })}
                                        />
                                        <FieldError message={err(line.key, 'product_id')} />
                                    </TableCell>

                                    {(mode === 'out' || mode === 'count') && (
                                        <TableCell className="pt-4 text-right tabular-nums text-muted-foreground">
                                            {line.product_id ? formatQty(onHand) : '—'}
                                        </TableCell>
                                    )}

                                    {mode === 'count' ? (
                                        <>
                                            <TableCell>
                                                <Input
                                                    type="number" min="0" step="1" inputMode="numeric"
                                                    value={line.counted_quantity}
                                                    onChange={(e) => update(line.key, { counted_quantity: e.target.value })}
                                                    placeholder="0"
                                                />
                                                <FieldError message={err(line.key, 'counted_quantity')} />
                                            </TableCell>
                                            <TableCell className="pt-4 text-right font-medium tabular-nums">
                                                {difference === null || !line.product_id
                                                    ? '—'
                                                    : `${difference > 0 ? '+' : ''}${formatQty(difference)}`}
                                            </TableCell>
                                        </>
                                    ) : (
                                        <TableCell>
                                            <Input
                                                type="number" min="1" step="1" inputMode="numeric"
                                                value={line.quantity}
                                                onChange={(e) => update(line.key, { quantity: e.target.value })}
                                                placeholder="0"
                                                aria-invalid={overdrawn || undefined}
                                                className={cn(overdrawn && 'border-destructive focus-visible:ring-destructive')}
                                            />
                                            {overdrawn && <FieldError message={`Only ${formatUnits(onHand)} on hand`} />}
                                            <FieldError message={err(line.key, 'quantity')} />
                                        </TableCell>
                                    )}

                                    {mode === 'in' && (
                                        <TableCell>
                                            <Input
                                                type="number" min="0" step="0.01" inputMode="decimal"
                                                value={line.unit_cost}
                                                onChange={(e) => update(line.key, { unit_cost: e.target.value })}
                                                placeholder="0.00"
                                            />
                                            <FieldError message={err(line.key, 'unit_cost')} />
                                        </TableCell>
                                    )}

                                    {showSalesPrice && (
                                        <TableCell>
                                            <Input
                                                type="number" min="0" step="0.01" inputMode="decimal"
                                                value={line.sales_unit_price}
                                                onChange={(e) => update(line.key, { sales_unit_price: e.target.value })}
                                                placeholder="0.00"
                                            />
                                            <FieldError message={err(line.key, 'sales_unit_price')} />
                                        </TableCell>
                                    )}

                                    {showExpiry && (
                                        <TableCell>
                                            <DatePicker
                                                value={line.expiry_date}
                                                onChange={(value) => update(line.key, { expiry_date: value })}
                                                placeholder="Optional"
                                            />
                                            <FieldError message={err(line.key, 'expiry_date')} />
                                        </TableCell>
                                    )}

                                    {(mode === 'in' || showSalesPrice) && (
                                        <TableCell className="pt-4 text-right tabular-nums">
                                            {formatMoney(Number(line.quantity || 0) * Number((mode === 'in' ? line.unit_cost : line.sales_unit_price) || 0))}
                                        </TableCell>
                                    )}

                                    <TableCell>
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => remove(line.key)}
                                            aria-label="Remove line"
                                        >
                                            <Trash2 />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                    {(mode === 'in' || showSalesPrice) && (
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={headers.length - 2} className="text-right">Total</TableCell>
                                <TableCell className="text-right font-semibold tabular-nums">
                                    RM {formatMoney(mode === 'in' ? totalCost : totalSales)}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <Button type="button" variant="outline" size="sm" onClick={add}>
                    <Plus />
                    Add line
                </Button>
                <span className="text-sm text-muted-foreground">
                    {lines.filter((l) => l.product_id).length} product(s)
                </span>
            </div>
            <FieldError message={errors.items} />
        </div>
    );
}

export function FieldError({ message }) {
    return message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null;
}

/** Turn editor lines into the payload the controller expects. */
export function linesPayload(lines, fields) {
    return lines
        .filter((line) => line.product_id)
        .map((line) => Object.fromEntries(['product_id', ...fields].map((f) => [f, line[f] === '' ? null : line[f]])));
}
