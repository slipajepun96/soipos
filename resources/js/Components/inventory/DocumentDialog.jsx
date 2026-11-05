import { useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, FileDown } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { DOC_TYPES, formatDate, formatMoney, formatQty } from '@/lib/format';

/** Eye button that opens a read-only view of a stock document and its lines. */
export default function DocumentDialog({ doc, trigger }) {
    const [open, setOpen] = useState(false);
    const [lines, setLines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError('');
        axios
            .get(route('inventory.documents.details', doc.id))
            .then(({ data }) => setLines(data.stocks || []))
            .catch(() => setError('Failed to load document lines.'))
            .finally(() => setLoading(false));
    }, [open, doc.id]);

    const type = doc.stock_doc_type;
    const meta = DOC_TYPES[type] || { label: type, party: 'Party' };
    const isInvoice = type === 'Sales Invoice';
    const isAdjustment = type === 'Stock Adjustment';
    const hasExpiry = type === 'GRN' || type === 'Opening Stock';
    const totalCost = lines.reduce((sum, l) => sum + Number(l.stock_total_cost || 0) * (isAdjustment && l.stock_entry_type === 'out' ? -1 : 1), 0);
    const totalSales = lines.reduce((sum, l) => sum + Number(l.stock_total_sales_price || 0), 0);
    const colCount = 5 + (isAdjustment ? 1 : 0) + (isInvoice ? 2 : 0) + (hasExpiry ? 1 : 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="View">
                        <Eye />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle>{doc.stock_doc_num || doc.id}</DialogTitle>
                        <Badge variant="secondary">{meta.label}</Badge>
                    </div>
                    <DialogDescription>{formatDate(doc.stock_doc_date)}</DialogDescription>
                </DialogHeader>

                <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm md:grid-cols-4">
                    <div>
                        <dt className="text-muted-foreground">{meta.party}</dt>
                        <dd className="font-medium">{doc.stock_doc_supplier_name || '—'}</dd>
                        {doc.stock_doc_supplier_rob_num && (
                            <dd className="text-xs text-muted-foreground">{doc.stock_doc_supplier_rob_num}</dd>
                        )}
                    </div>
                    {doc.transportation_mode && (
                        <div>
                            <dt className="text-muted-foreground">Transportation</dt>
                            <dd className="font-medium">{doc.transportation_mode}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-muted-foreground">{isAdjustment ? 'Net cost change' : 'Total cost'}</dt>
                        <dd className="font-medium tabular-nums">RM {formatMoney(doc.stock_doc_total_cost)}</dd>
                    </div>
                    {isInvoice && (
                        <div>
                            <dt className="text-muted-foreground">Invoice total</dt>
                            <dd className="font-medium tabular-nums">RM {formatMoney(doc.stock_doc_total_sales_price)}</dd>
                        </div>
                    )}
                    {doc.remarks && (
                        <div className="col-span-2 md:col-span-4">
                            <dt className="text-muted-foreground">Remarks</dt>
                            <dd>{doc.remarks}</dd>
                        </div>
                    )}
                </dl>

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">#</TableHead>
                                <TableHead>Product</TableHead>
                                {isAdjustment && <TableHead>Change</TableHead>}
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Unit cost</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                {isInvoice && <TableHead className="text-right">Price</TableHead>}
                                {isInvoice && <TableHead className="text-right">Amount</TableHead>}
                                {hasExpiry && <TableHead>Expiry</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={colCount} className="py-8 text-center text-muted-foreground">Loading…</TableCell>
                                </TableRow>
                            )}
                            {!loading && error && (
                                <TableRow>
                                    <TableCell colSpan={colCount} className="py-8 text-center text-destructive">{error}</TableCell>
                                </TableRow>
                            )}
                            {!loading && !error && lines.map((line, i) => (
                                <TableRow key={line.id}>
                                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{line.stock_product_name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {line.stock_number_of_measure} {line.stock_product_unit}
                                        </div>
                                    </TableCell>
                                    {isAdjustment && (
                                        <TableCell>
                                            <Badge variant={line.stock_entry_type === 'in' ? 'default' : 'outline'}>
                                                {line.stock_entry_type === 'in' ? 'Increase' : 'Decrease'}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right tabular-nums">{formatQty(line.stock_quantity)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatMoney(line.stock_unit_cost)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatMoney(line.stock_total_cost)}</TableCell>
                                    {isInvoice && <TableCell className="text-right tabular-nums">{formatMoney(line.stock_unit_sales_price)}</TableCell>}
                                    {isInvoice && <TableCell className="text-right tabular-nums">{formatMoney(line.stock_total_sales_price)}</TableCell>}
                                    {hasExpiry && <TableCell>{formatDate(line.stock_expiry_date)}</TableCell>}
                                </TableRow>
                            ))}
                            {!loading && !error && lines.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={colCount} className="py-8 text-center text-muted-foreground">No lines.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {!loading && lines.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={isAdjustment ? 5 : 4} className="text-right">Total</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatMoney(totalCost)}</TableCell>
                                    {isInvoice && <TableCell />}
                                    {isInvoice && <TableCell className="text-right tabular-nums">{formatMoney(totalSales)}</TableCell>}
                                    {hasExpiry && <TableCell />}
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" asChild>
                        <a href={route('inventory.documents.pdf', doc.id)}>
                            <FileDown />
                            Download PDF
                        </a>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
