import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/notifications';
import { ArrowLeft, Banknote, CreditCard, Landmark, Loader2, PackageCheck, Search, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const METHOD_ICONS = { Cash: Banknote, Card: CreditCard, 'E-Wallet': Smartphone, 'Bank Transfer': Landmark };
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function cashSuggestions(total) {
    if (total <= 0) return [];
    const values = [total, ...[5, 10, 20, 50, 100].map((n) => Math.ceil(total / n) * n)];
    return [...new Set(values.map(round2))].filter((v) => v >= total).slice(0, 4);
}

/**
 * Find a pending pre-order, take payment and hand it over.
 * `initialOrderId` opens straight on one order (from the session page's "Collect at POS").
 */
export default function CollectPreorderDialog({ open, onOpenChange, paymentMethods, initialOrderId, onCollected }) {
    const [order, setOrder] = useState(null);

    useEffect(() => {
        if (!open) { setOrder(null); return; }
        if (initialOrderId) {
            axios.get(route('pos.preorders.show', initialOrderId))
                .then(({ data }) => setOrder(data.order))
                .catch(() => { setOrder(null); toast.error('That pre-order could not be found.'); });
        }
    }, [open, initialOrderId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92dvh] flex-col gap-4 sm:max-w-lg">
                {order
                    ? <CollectStep order={order} paymentMethods={paymentMethods} onBack={() => setOrder(null)} onCollected={onCollected} />
                    : <SearchStep onPick={setOrder} />}
            </DialogContent>
        </Dialog>
    );
}

function SearchStep({ onPick }) {
    const [query, setQuery] = useState('');
    const [orders, setOrders] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const t = setTimeout(() => {
            axios.get(route('pos.preorders.search'), { params: { q: query } })
                .then(({ data }) => { if (!cancelled) setOrders(data.orders); })
                .finally(() => { if (!cancelled) setLoading(false); });
        }, 250);
        return () => { cancelled = true; clearTimeout(t); };
    }, [query]);

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && orders?.length === 1) { e.preventDefault(); onPick(orders[0]); }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Collect pre-order</DialogTitle>
                <DialogDescription>Search by order number, customer name or phone.</DialogDescription>
            </DialogHeader>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} placeholder="PO000012, Aminah or 0123456789" className="h-11 pl-9 pr-9" />
                {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            <div className="-mx-6 min-h-40 flex-1 overflow-y-auto border-t px-6">
                {orders && orders.length === 0 && (
                    <p className="py-10 text-center text-sm text-muted-foreground">No pending orders match.</p>
                )}
                <ul className="divide-y">
                    {orders?.map((o) => (
                        <li key={o.id}>
                            <button type="button" onClick={() => onPick(o)} className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-accent/50">
                                <div className="min-w-0">
                                    <p className="font-medium">{o.customer_name} <span className="font-mono text-xs text-muted-foreground">{o.order_no}</span></p>
                                    <p className="text-sm text-muted-foreground">{o.customer_phone}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {o.lines.map((l) => `${l.quantity}× ${l.label}`).join(', ')}
                                    </p>
                                    {o.session && <p className="truncate text-xs text-muted-foreground">{o.session.name}{o.session.pickup_date ? ` · ${formatDate(o.session.pickup_date)}` : ''}</p>}
                                </div>
                                <span className="shrink-0 font-semibold tabular-nums">RM {formatMoney(o.total)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

function CollectStep({ order, paymentMethods, onBack, onCollected }) {
    const [method, setMethod] = useState(paymentMethods[0] || 'Cash');
    const [tendered, setTendered] = useState('');
    const [reference, setReference] = useState('');
    const [errors, setErrors] = useState([]);
    const [processing, setProcessing] = useState(false);
    const buttonRef = useRef(null);

    const total = order.total;
    const isCash = method === 'Cash';
    const paid = isCash ? Number(tendered || 0) : total;
    const change = round2(paid - total);
    const pending = order.status === 'pending';
    const canCollect = pending && !processing && (!isCash || paid >= total);

    const collect = async () => {
        if (!canCollect) return;
        setProcessing(true);
        setErrors([]);
        try {
            const { data } = await axios.post(route('pos.preorders.collect', order.id), {
                payment_method: method,
                amount_tendered: isCash ? paid : null,
                payment_reference: reference || null,
            });
            onCollected(data.sale);
        } catch (error) {
            const bag = error.response?.data?.errors;
            setErrors(bag ? [...new Set(Object.values(bag).flat())] : [error.response?.data?.message || 'Could not collect. Please try again.']);
            toast.error('Not collected', { description: errorMessage(error) });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8" onClick={onBack} aria-label="Back"><ArrowLeft /></Button>
                    <DialogTitle>{order.customer_name}</DialogTitle>
                </div>
                <DialogDescription>
                    <span className="font-mono">{order.order_no}</span> · {order.customer_phone}
                    {order.session && <> · {order.session.name}</>}
                </DialogDescription>
            </DialogHeader>

            <div className="-mx-6 flex-1 space-y-4 overflow-y-auto px-6">
                {!pending && (
                    <Alert><AlertDescription>This order is already {order.status}{order.sale ? ` (${order.sale.receipt_no})` : ''}.</AlertDescription></Alert>
                )}

                <div className="space-y-1.5 rounded-lg border p-3 text-sm">
                    {order.lines.map((l) => (
                        <div key={l.id} className="flex justify-between gap-3">
                            <span><span className="font-semibold tabular-nums">{l.quantity}×</span> {l.label}</span>
                            <span className="tabular-nums">{formatMoney(l.line_total)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between border-t pt-2 text-base font-semibold">
                        <span>Total</span>
                        <span className="tabular-nums">RM {formatMoney(total)}</span>
                    </div>
                    {order.customer_address && <p className="whitespace-pre-line border-t pt-2 text-xs text-muted-foreground">{order.customer_address}</p>}
                    {order.notes && <p className="text-xs italic text-muted-foreground">“{order.notes}”</p>}
                </div>

                {pending && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {paymentMethods.map((m) => {
                                const Icon = METHOD_ICONS[m] || Banknote;
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMethod(m)}
                                        className={cn(
                                            'flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors',
                                            method === m ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />{m}
                                    </button>
                                );
                            })}
                        </div>
                        {isCash ? (
                            <div className="space-y-2">
                                <Label htmlFor="collect-tendered">Cash received</Label>
                                <Input
                                    id="collect-tendered" type="number" min="0" step="0.01" inputMode="decimal"
                                    value={tendered} onChange={(e) => setTendered(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); collect(); } }}
                                    className="h-11 text-right text-lg tabular-nums"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {cashSuggestions(total).map((v) => (
                                        <Button key={v} type="button" variant="outline" size="sm" onClick={() => { setTendered(String(v)); buttonRef.current?.focus(); }}>
                                            {formatMoney(v)}
                                        </Button>
                                    ))}
                                </div>
                                {paid >= total && tendered !== '' && (
                                    <div className="flex items-baseline justify-between rounded-lg bg-muted p-3">
                                        <span className="font-medium">Change</span>
                                        <span className="text-2xl font-bold tabular-nums">RM {formatMoney(change)}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="collect-ref">Reference</Label>
                                <Input id="collect-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional, e.g. last 4 digits / transaction ID" />
                            </div>
                        )}
                    </div>
                )}

                {errors.length > 0 && (
                    <Alert variant="destructive"><AlertDescription>{errors.join(' ')}</AlertDescription></Alert>
                )}
            </div>

            {pending && (
                <Button ref={buttonRef} size="lg" className="h-12 text-base" disabled={!canCollect} onClick={collect}>
                    {processing ? <Loader2 className="animate-spin" /> : <PackageCheck />}
                    Collected · charge RM {formatMoney(total)}
                </Button>
            )}
        </>
    );
}
