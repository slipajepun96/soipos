import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { addDays, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import DatePicker from '@/Components/inventory/DatePicker';
import DocumentForm from '@/Components/inventory/DocumentForm';
import FormField from '@/Components/inventory/FormField';
import LineItemsEditor, { emptyLine } from '@/Components/inventory/LineItemsEditor';
import { formatMoney, today } from '@/lib/format';
import { cn } from '@/lib/utils';

const TERMS = [
    { days: 0, label: 'Due on receipt' },
    { days: 7, label: '7 days' },
    { days: 14, label: '14 days' },
    { days: 30, label: '30 days' },
    { days: 60, label: '60 days' },
];

const PAYMENT_OPTIONS = [
    { key: 'later', label: 'Pay later', hint: 'Customer pays by the due date' },
    { key: 'deposit', label: 'Deposit', hint: 'Part paid now, rest later' },
    { key: 'full', label: 'Paid in full', hint: 'Customer pays the whole amount now' },
];

const plusDays = (date, days) => format(addDays(new Date(`${date}T00:00:00`), days), 'yyyy-MM-dd');
const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:border-input focus:ring-1 focus:ring-ring';

export default function CreateInvoice({ products = [], availableStock = {}, paymentMethods = [], events = [] }) {
    const [lines, setLines] = useState([emptyLine()]);
    const [terms, setTerms] = useState(30);
    const [payment, setPayment] = useState('later');
    const form = useForm({
        customer_name: '',
        customer_company: '',
        customer_phone: '',
        customer_email: '',
        customer_address: '',
        sale_date: today(),
        due_date: plusDays(today(), 30),
        notes: '',
        sales_event_id: '',
        discount: '',
        payment_method: paymentMethods[0] || 'Cash',
        payment_amount: '',
        payment_reference: '',
    });
    const { data, setData, errors } = form;

    const subtotal = lines.reduce((sum, l) => sum + Number(l.quantity || 0) * Number(l.sales_unit_price || 0), 0);
    const discount = Math.min(subtotal, Number(data.discount || 0));
    const total = Math.round((subtotal - discount) * 100) / 100;
    const paidNow = payment === 'full' ? total : payment === 'deposit' ? Number(data.payment_amount || 0) : 0;
    const unstocked = new Set(products.filter((p) => (p.track_stock === false && !p.is_bundle) || availableStock[p.id] === null).map((p) => p.id));
    const overdrawn = lines.some((l) => l.product_id && !unstocked.has(l.product_id)
        && Number(l.quantity || 0) > Number(availableStock[l.product_id] || 0));

    const setDate = (value) => {
        setData((d) => ({ ...d, sale_date: value, due_date: terms === null ? d.due_date : plusDays(value, terms) }));
    };
    const setTermDays = (days) => {
        setTerms(days);
        if (days !== null) setData('due_date', plusDays(data.sale_date, days));
    };

    const submit = (e) => {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            discount: d.discount || 0,
            sales_event_id: d.sales_event_id || null,
            pay_later: payment === 'later',
            payment_method: payment === 'later' ? null : d.payment_method,
            payment_amount: payment === 'deposit' ? d.payment_amount || 0 : null,
            items: lines
                .filter((l) => l.product_id)
                .map((l) => ({ product_id: l.product_id, quantity: l.quantity, unit_price: l.sales_unit_price || 0 })),
        }));
        form.post(route('sales.invoices.store'), { preserveScroll: true });
    };

    // LineItemsEditor reports item errors as items.N.sales_unit_price; the server uses unit_price.
    const itemErrors = Object.fromEntries(Object.entries(errors).map(([k, v]) => [k.replace(/\.unit_price$/, '.sales_unit_price'), v]));

    return (
        <DocumentForm
            title="New Invoice"
            description="Bill a customer. Stock is deducted now; payment can follow later."
            backHref={route('sales.invoices.index')}
            onSubmit={submit}
            processing={form.processing}
            canSubmit={lines.some((l) => l.product_id) && !overdrawn && !!data.customer_name.trim()}
            submitLabel={payment === 'later' ? 'Issue invoice' : payment === 'full' ? 'Issue paid invoice' : 'Issue invoice with deposit'}
            details={(
                <>
                    <FormField label="Customer name" htmlFor="customer_name" required error={errors.customer_name}>
                        <Input id="customer_name" value={data.customer_name} onChange={(e) => setData('customer_name', e.target.value)} placeholder="Contact person" />
                    </FormField>
                    <FormField label="Company" htmlFor="customer_company" error={errors.customer_company} hint="Optional — shown as the bill-to name">
                        <Input id="customer_company" value={data.customer_company} onChange={(e) => setData('customer_company', e.target.value)} />
                    </FormField>
                    <FormField label="Phone" htmlFor="customer_phone" error={errors.customer_phone}>
                        <Input id="customer_phone" type="tel" value={data.customer_phone} onChange={(e) => setData('customer_phone', e.target.value)} />
                    </FormField>
                    <FormField label="Email" htmlFor="customer_email" error={errors.customer_email}>
                        <Input id="customer_email" type="email" value={data.customer_email} onChange={(e) => setData('customer_email', e.target.value)} />
                    </FormField>
                    <FormField label="Billing address" htmlFor="customer_address" error={errors.customer_address} className="md:col-span-2">
                        <Textarea id="customer_address" rows={2} value={data.customer_address} onChange={(e) => setData('customer_address', e.target.value)} />
                    </FormField>
                    <FormField label="Invoice date" htmlFor="sale_date" required error={errors.sale_date}>
                        <DatePicker id="sale_date" value={data.sale_date} onChange={(v) => v && setDate(v)} />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Terms" htmlFor="terms">
                            <select
                                id="terms"
                                className={selectClass}
                                value={terms ?? 'custom'}
                                onChange={(e) => setTermDays(e.target.value === 'custom' ? null : Number(e.target.value))}
                            >
                                {TERMS.map((t) => <option key={t.days} value={t.days}>{t.label}</option>)}
                                <option value="custom">Custom</option>
                            </select>
                        </FormField>
                        <FormField label="Due date" htmlFor="due_date" error={errors.due_date}>
                            <DatePicker id="due_date" value={data.due_date} onChange={(v) => { if (v) { setTerms(null); setData('due_date', v); } }} />
                        </FormField>
                    </div>
                    {events.length > 0 && (
                        <FormField label="Event" htmlFor="sales_event_id" error={errors.sales_event_id} hint="Optional — include this invoice in an event report" className="md:col-span-2">
                            <select id="sales_event_id" className={selectClass} value={data.sales_event_id} onChange={(e) => setData('sales_event_id', e.target.value)}>
                                <option value="">Not part of an event</option>
                                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                            </select>
                        </FormField>
                    )}
                    <FormField label="Notes" htmlFor="notes" error={errors.notes} className="md:col-span-2" hint="Printed on the invoice, e.g. bank details or delivery terms">
                        <Textarea id="notes" rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    </FormField>
                </>
            )}
            items={(
                <LineItemsEditor
                    mode="out"
                    products={products}
                    available={availableStock}
                    lines={lines}
                    onChange={setLines}
                    showSalesPrice
                    errors={itemErrors}
                />
            )}
            extra={(
                <Card>
                    <CardHeader>
                        <CardTitle>Total & payment</CardTitle>
                        <CardDescription>Record a payment now, or leave it unpaid and record payments from the Invoices page.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {PAYMENT_OPTIONS.map((o) => (
                                    <button
                                        key={o.key}
                                        type="button"
                                        onClick={() => setPayment(o.key)}
                                        className={cn(
                                            'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                                            payment === o.key ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                                        )}
                                    >
                                        <div className="font-medium">{o.label}</div>
                                        <div className={cn('text-xs', payment === o.key ? 'opacity-80' : 'text-muted-foreground')}>{o.hint}</div>
                                    </button>
                                ))}
                            </div>
                            {payment !== 'later' && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField label="Method" htmlFor="payment_method" error={errors.payment_method}>
                                        <select id="payment_method" className={selectClass} value={data.payment_method} onChange={(e) => setData('payment_method', e.target.value)}>
                                            {paymentMethods.map((m) => <option key={m}>{m}</option>)}
                                        </select>
                                    </FormField>
                                    {payment === 'deposit' && (
                                        <FormField label="Deposit (RM)" htmlFor="payment_amount" required error={errors.payment_amount}>
                                            <Input
                                                id="payment_amount" type="number" min="0" step="0.01"
                                                value={data.payment_amount}
                                                onChange={(e) => setData('payment_amount', e.target.value)}
                                                className="text-right tabular-nums"
                                            />
                                        </FormField>
                                    )}
                                    <FormField label="Reference" htmlFor="payment_reference" error={errors.payment_reference} className={payment === 'deposit' ? 'sm:col-span-2' : ''}>
                                        <Input id="payment_reference" value={data.payment_reference} onChange={(e) => setData('payment_reference', e.target.value)} placeholder="Optional" />
                                    </FormField>
                                </div>
                            )}
                        </div>

                        <dl className="space-y-2 rounded-lg border p-4 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Subtotal</dt>
                                <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-muted-foreground">Discount (RM)</dt>
                                <dd>
                                    <Input
                                        type="number" min="0" step="0.01"
                                        value={data.discount}
                                        onChange={(e) => setData('discount', e.target.value)}
                                        placeholder="0.00"
                                        className="h-8 w-28 text-right tabular-nums"
                                    />
                                </dd>
                            </div>
                            {errors.discount && <p className="text-right text-xs text-destructive">{errors.discount}</p>}
                            <div className="flex justify-between border-t pt-2 text-base font-semibold">
                                <dt>Total</dt>
                                <dd className="tabular-nums">RM {formatMoney(total)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Paid now</dt>
                                <dd className="tabular-nums">{formatMoney(paidNow)}</dd>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <dt>Balance due</dt>
                                <dd className={cn('tabular-nums', paidNow > total && 'text-destructive')}>RM {formatMoney(Math.max(0, total - paidNow))}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            )}
        />
    );
}
