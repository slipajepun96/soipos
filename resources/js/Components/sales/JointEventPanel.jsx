import { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Handshake, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import ProductCombobox from '@/Components/inventory/ProductCombobox';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Joint event section of an event page.
 * Host: partner stores, joint POS, settlement per store. Partner: what the host collected for it.
 * Both: this store's products for the event and their event prices.
 */
export default function JointEventPanel({ event, joint, eventProducts = [], productOptions = [] }) {
    const isHost = joint?.role === 'host';
    const isPartner = joint?.role === 'partner';
    if (!joint) return null; // not a joint event

    return (
        <div className="space-y-4">
            {isPartner ? <PartnerCard joint={joint} /> : <HostCard event={event} joint={joint} />}
            {joint && <EventProductsCard event={event} eventProducts={eventProducts} productOptions={productOptions} />}
            {isHost && <SettlementCard event={event} joint={joint} />}
        </div>
    );
}

function HostCard({ event, joint }) {
    const partners = joint.stores.filter((s) => !s.is_host);

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                    <CardTitle className="flex items-center gap-2 text-base"><Handshake className="h-4 w-4" />Joint event</CardTitle>
                    <CardDescription>
                        This store is the host: the joint POS sells every store's products and all payments come to this store.
                        Change partner stores with Edit on the Events page.
                    </CardDescription>
                </div>
                {event.status === 'open' && (
                    <Button asChild>
                        <Link href={route('sales.events.jointPos', event.id)}><ShoppingCart />Open joint POS</Link>
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {partners.map((p) => (
                    <span key={p.partner_id} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        {p.store_name}
                        {p.short_code && <Badge variant="secondary">{p.short_code}</Badge>}
                    </span>
                ))}
            </CardContent>
        </Card>
    );
}

function PartnerCard({ joint }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Handshake className="h-4 w-4" />Joint event</CardTitle>
                <CardDescription>
                    Hosted by <span className="font-medium text-foreground">{joint.host.name}</span>. They sell your products at their POS and collect the
                    payments, then pay you after the event. Your sales, stock and receipts below are your own.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
                <Figure label={`Collected by ${joint.host.short_code || joint.host.name}`} value={joint.owed} />
                <Figure
                    label="Paid to you"
                    value={joint.settled_amount ?? 0}
                    hint={joint.settled_at ? `${formatDate(joint.settled_at)} by ${joint.settled_by}${joint.settlement_note ? ` · ${joint.settlement_note}` : ''}` : 'Not settled yet'}
                />
                <Figure label="Still owed to you" value={joint.balance} alert={joint.balance > 0.004} />
            </CardContent>
        </Card>
    );
}

function EventProductsCard({ event, eventProducts, productOptions }) {
    const form = useForm({ products: eventProducts.map((p) => ({ product_id: p.product_id, price: String(p.price) })) });
    const rows = form.data.products;
    const setRows = (next) => form.setData('products', next);
    const byId = Object.fromEntries(productOptions.map((p) => [p.id, p]));

    const save = () => form.put(route('sales.events.products.save', event.id), { preserveScroll: true });
    const addAll = () => setRows([
        ...rows,
        ...productOptions.filter((p) => !rows.some((r) => r.product_id === p.id)).map((p) => ({ product_id: p.id, price: String(Number(p.product_price || 0)) })),
    ]);

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                    <CardTitle className="text-base">Our products at this event</CardTitle>
                    <CardDescription>Only these show on the joint POS, at the event price set here. The cashier cannot change it.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addAll} disabled={rows.length >= productOptions.length}>Add all products</Button>
            </CardHeader>
            <CardContent className="space-y-2">
                {rows.length === 0 && <p className="text-sm text-muted-foreground">No products yet. Nothing from this store shows on the joint POS.</p>}
                {rows.map((row, index) => {
                    const product = byId[row.product_id];
                    const error = form.errors[`products.${index}.product_id`] || form.errors[`products.${index}.price`];
                    return (
                        <div key={index} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1">
                                    <ProductCombobox
                                        products={productOptions}
                                        value={row.product_id}
                                        disabledIds={rows.filter((_, i) => i !== index).map((r) => r.product_id)}
                                        onChange={(p) => setRows(rows.map((r, i) => (i === index
                                            ? { product_id: p.id, price: r.price === '' ? String(Number(p.product_price || 0)) : r.price }
                                            : r)))}
                                    />
                                </div>
                                <div className="relative w-28">
                                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">RM</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.price}
                                        onChange={(e) => setRows(rows.map((r, i) => (i === index ? { ...r, price: e.target.value } : r)))}
                                        className="pl-8 text-right tabular-nums"
                                        aria-label="Event price"
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setRows(rows.filter((_, i) => i !== index))} aria-label="Remove product">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            {product && Number(row.price) !== Number(product.product_price) && (
                                <p className="text-xs text-muted-foreground">Normal price RM {formatMoney(product.product_price)}</p>
                            )}
                            {error && <p className="text-xs text-destructive">{error}</p>}
                        </div>
                    );
                })}
                {form.errors.products && <p className="text-xs text-destructive">{form.errors.products}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setRows([...rows, { product_id: '', price: '' }])}><Plus />Add product</Button>
                    <div className="flex items-center gap-3">
                        {form.recentlySuccessful && <span className="text-sm text-muted-foreground">Saved.</span>}
                        <Button onClick={save} disabled={!form.isDirty || form.processing}>{form.processing ? 'Saving…' : 'Save products'}</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SettlementCard({ event, joint }) {
    const [editing, setEditing] = useState(null); // partner_id being settled
    const methods = Object.keys(joint.collected_by_method).filter((m) => joint.collected_by_method[m] > 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Settlement</CardTitle>
                <CardDescription>
                    Joint POS sales by store. All of it was paid to this store; pay each partner what is still owed.
                </CardDescription>
            </CardHeader>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="pl-6">Store</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        {methods.map((m) => <TableHead key={m} className="hidden text-right md:table-cell">{m}</TableHead>)}
                        <TableHead className="text-right">Total (RM)</TableHead>
                        <TableHead className="text-right">Paid out</TableHead>
                        <TableHead className="pr-6 text-right">Owed (RM)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {joint.stores.map((s) => (
                        <TableRow key={s.store_id}>
                            <TableCell className="pl-6 font-medium">
                                {s.store_name} {s.is_host && <Badge variant="outline" className="ml-1">host</Badge>}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{s.count}</TableCell>
                            {methods.map((m) => <TableCell key={m} className="hidden text-right tabular-nums md:table-cell">{formatMoney(s.by_method[m])}</TableCell>)}
                            <TableCell className="text-right tabular-nums">{formatMoney(s.total)}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                {s.is_host ? '—' : (
                                    <>
                                        {formatMoney(s.settled_amount ?? 0)}
                                        {s.settled_at && <div className="text-xs">{formatDate(s.settled_at)}</div>}
                                    </>
                                )}
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                                {s.is_host ? <span className="text-muted-foreground">—</span> : (
                                    <div className="flex items-center justify-end gap-2">
                                        <span className={cn('font-semibold tabular-nums', s.balance > 0.004 && 'text-destructive')}>{formatMoney(s.balance)}</span>
                                        <Button size="sm" variant="outline" onClick={() => setEditing(editing === s.partner_id ? null : s.partner_id)}>Record</Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell className="pl-6">Collected by this store</TableCell>
                        <TableCell />
                        {methods.map((m) => <TableCell key={m} className="hidden text-right tabular-nums md:table-cell">{formatMoney(joint.collected_by_method[m])}</TableCell>)}
                        <TableCell className="text-right tabular-nums">{formatMoney(joint.collected)}</TableCell>
                        <TableCell />
                        <TableCell className="pr-6 text-right tabular-nums">{formatMoney(joint.balance)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
            {editing && (
                <SettleForm
                    event={event}
                    store={joint.stores.find((s) => s.partner_id === editing)}
                    onDone={() => setEditing(null)}
                />
            )}
        </Card>
    );
}

function SettleForm({ event, store, onDone }) {
    const form = useForm({ amount: String(store.owed), note: store.settlement_note ?? '' });
    const submit = (e) => {
        e.preventDefault();
        form.post(route('sales.events.partners.settle', [event.id, store.partner_id]), { preserveScroll: true, onSuccess: onDone });
    };

    return (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2 border-t p-4">
            <div className="text-sm">
                <p className="font-medium">Paid to {store.store_name}</p>
                <p className="text-xs text-muted-foreground">Total paid so far, e.g. RM {formatMoney(store.owed)} for everything.</p>
            </div>
            <Input type="number" min="0" step="0.01" value={form.data.amount} onChange={(e) => form.setData('amount', e.target.value)} className="w-32 text-right" aria-label="Amount paid" />
            <Input value={form.data.note} onChange={(e) => form.setData('note', e.target.value)} placeholder="Note, e.g. bank transfer ref" className="min-w-48 flex-1" />
            <Button type="submit" disabled={form.processing}>Save</Button>
            <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
            {(form.errors.amount || form.errors.note) && <p className="w-full text-xs text-destructive">{form.errors.amount || form.errors.note}</p>}
        </form>
    );
}

function Figure({ label, value, hint, alert = false }) {
    return (
        <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-xl font-semibold tabular-nums', alert && 'text-destructive')}>RM {formatMoney(value)}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}
