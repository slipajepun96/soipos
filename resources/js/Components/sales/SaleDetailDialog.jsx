import { useCallback, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { Ban, FileText, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import DatePicker from '@/Components/inventory/DatePicker';
import { formatDate, formatMoney, formatQty, today } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DocTypeBadge, PaymentStatusBadge } from './SaleBadges';

const time = (iso) => (iso ? format(new Date(iso), 'HH:mm') : '');

/**
 * Full view of a receipt or invoice: items, totals, payments, and for open
 * invoices a form to record a payment.
 */
export default function SaleDetailDialog({ sale, paymentMethods = [], onClose, onVoid, actions }) {
    const [detail, setDetail] = useState(null);

    const load = useCallback(() => {
        if (!sale) return;
        axios.get(route('sales.show', sale.id)).then(({ data }) => setDetail(data.sale));
    }, [sale]);

    useEffect(() => { setDetail(null); load(); }, [load]);

    if (!sale) return null;
    const s = detail || sale;
    const voided = s.status === 'voided';
    const isInvoice = s.document_type === 'invoice';
    const canPay = !voided && s.balance_due > 0;

    const removePayment = (payment) => {
        if (!window.confirm(`Remove the RM ${formatMoney(payment.amount)} payment?`)) return;
        router.delete(route('sales.payments.destroy', [s.id, payment.id]), {
            preserveScroll: true,
            onSuccess: load,
        });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle>{s.receipt_no}</DialogTitle>
                        <DocTypeBadge sale={s} />
                        <PaymentStatusBadge sale={s} />
                    </div>
                    <DialogDescription>
                        {formatDate(s.sale_date)} {time(s.created_at)} · {s.cashier_name || '—'}
                        {isInvoice && s.due_date && ` · Due ${formatDate(s.due_date)}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
                    <div>
                        <p className="text-muted-foreground">{isInvoice ? 'Bill to' : 'Customer'}</p>
                        <p className="font-medium">{s.customer_company || s.customer_name || 'Walk-in customer'}</p>
                        {s.customer_company && s.customer_name && <p>Attn: {s.customer_name}</p>}
                        {s.customer_address && <p className="whitespace-pre-line text-muted-foreground">{s.customer_address}</p>}
                        {(s.customer_phone || s.customer_email) && (
                            <p className="text-muted-foreground">{[s.customer_phone, s.customer_email].filter(Boolean).join(' · ')}</p>
                        )}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:text-right">
                        <dt className="text-muted-foreground">Total</dt>
                        <dd className="font-medium tabular-nums">RM {formatMoney(s.total)}</dd>
                        <dt className="text-muted-foreground">Paid</dt>
                        <dd className="tabular-nums">RM {formatMoney(s.amount_paid)}</dd>
                        <dt className="text-muted-foreground">Balance due</dt>
                        <dd className={cn('font-semibold tabular-nums', s.is_overdue && 'text-destructive')}>RM {formatMoney(s.balance_due)}</dd>
                    </dl>
                </div>

                {voided && (
                    <div className="rounded-lg border p-3 text-sm">Voided by {s.voided_by} — {s.void_reason}</div>
                )}

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4">Product</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="pr-4 text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!detail && (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Loading…</TableCell>
                                </TableRow>
                            )}
                            {detail?.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="pl-4">
                                        <div className="font-medium">{item.product_name}</div>
                                        {item.product_sku_code && <div className="text-xs text-muted-foreground">SKU {item.product_sku_code}</div>}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{formatQty(item.quantity)} {item.product_unit}</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatMoney(item.unit_price)}</TableCell>
                                    <TableCell className="pr-4 text-right tabular-nums">{formatMoney(item.line_total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="pl-4 text-right font-normal text-muted-foreground">Subtotal</TableCell>
                                <TableCell className="pr-4 text-right tabular-nums">{formatMoney(s.subtotal)}</TableCell>
                            </TableRow>
                            {s.discount > 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="pl-4 text-right font-normal text-muted-foreground">Discount</TableCell>
                                    <TableCell className="pr-4 text-right tabular-nums">−{formatMoney(s.discount)}</TableCell>
                                </TableRow>
                            )}
                            <TableRow>
                                <TableCell colSpan={3} className="pl-4 text-right">Total</TableCell>
                                <TableCell className="pr-4 text-right font-bold tabular-nums">RM {formatMoney(s.total)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>

                {s.notes && (
                    <div className="text-sm">
                        <p className="text-muted-foreground">Notes</p>
                        <p className="whitespace-pre-line">{s.notes}</p>
                    </div>
                )}

                <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Payments</h3>
                    {detail && detail.payments.length === 0 && (
                        <p className="text-sm text-muted-foreground">No payments yet.</p>
                    )}
                    {detail && detail.payments.length > 0 && (
                        <div className="rounded-lg border">
                            <Table>
                                <TableBody>
                                    {detail.payments.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="pl-4">{formatDate(p.payment_date)}</TableCell>
                                            <TableCell>
                                                <div>{p.method}</div>
                                                {p.reference && <div className="text-xs text-muted-foreground">{p.reference}</div>}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{p.received_by}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatMoney(p.amount)}</TableCell>
                                            <TableCell className="w-10 pr-2">
                                                {isInvoice && !voided && (
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => removePayment(p)}
                                                        aria-label="Remove payment"
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {canPay && <RecordPaymentForm sale={s} paymentMethods={paymentMethods} onRecorded={load} />}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {!voided && onVoid && (
                        <Button variant="outline" className="sm:mr-auto" onClick={() => onVoid(s)}>
                            <Ban />
                            Void
                        </Button>
                    )}
                    {actions?.(s)}
                    <Button variant="outline" asChild>
                        <a href={route('sales.receipt', s.id)} target="_blank" rel="noopener">
                            <Printer />
                            Receipt
                        </a>
                    </Button>
                    {isInvoice && (
                        <Button asChild>
                            <a href={route('sales.invoice', s.id)} target="_blank" rel="noopener">
                                <FileText />
                                Invoice PDF
                            </a>
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RecordPaymentForm({ sale, paymentMethods, onRecorded }) {
    const [data, setData] = useState({
        payment_date: today(),
        method: paymentMethods[0] || 'Cash',
        amount: String(sale.balance_due),
        reference: '',
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => setData((d) => ({ ...d, amount: String(sale.balance_due) })), [sale.balance_due]);

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('sales.payments.store', sale.id), data, {
            preserveScroll: true,
            onSuccess: () => { setErrors({}); setData((d) => ({ ...d, reference: '' })); onRecorded(); },
            onError: setErrors,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">Record payment</p>
            <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                    <Label className="text-xs">Date</Label>
                    <DatePicker value={data.payment_date} onChange={(v) => setData({ ...data, payment_date: v })} className="bg-background" />
                    {errors.payment_date && <p className="text-xs text-destructive">{errors.payment_date}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs" htmlFor="pay-method">Method</Label>
                    <select
                        id="pay-method"
                        value={data.method}
                        onChange={(e) => setData({ ...data, method: e.target.value })}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:border-input focus:ring-1 focus:ring-ring"
                    >
                        {paymentMethods.map((m) => <option key={m}>{m}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs" htmlFor="pay-amount">Amount (RM)</Label>
                    <Input
                        id="pay-amount" type="number" min="0.01" step="0.01"
                        value={data.amount}
                        onChange={(e) => setData({ ...data, amount: e.target.value })}
                        className="bg-background text-right tabular-nums"
                    />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs" htmlFor="pay-ref">Reference</Label>
                    <Input
                        id="pay-ref"
                        value={data.reference}
                        onChange={(e) => setData({ ...data, reference: e.target.value })}
                        placeholder="Optional"
                        className="bg-background"
                    />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={processing || !(Number(data.amount) > 0)}>
                    {processing ? 'Saving…' : `Record RM ${formatMoney(data.amount)}`}
                </Button>
            </div>
        </form>
    );
}
