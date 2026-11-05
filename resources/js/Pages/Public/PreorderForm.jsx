import { useForm } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { PickupInfo, PublicShell } from '@/Components/preorders/PublicShell';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function PreorderForm({ token, shop, session, accepting, items = [] }) {
    const form = useForm({
        name: '',
        phone: '',
        address: '',
        notes: '',
        website: '', // honeypot
        items: Object.fromEntries(items.map((i) => [i.id, 0])),
    });
    const { data, setData, errors } = form;

    const limitOf = (item) => Math.min(item.max ?? Infinity, item.left ?? Infinity, 999);
    const setUnits = (item, units) => setData('items', { ...data.items, [item.id]: Math.max(0, Math.min(limitOf(item), units)) });

    const chosen = items.filter((i) => data.items[i.id] > 0);
    const unitCount = chosen.reduce((s, i) => s + data.items[i.id], 0);
    const total = chosen.reduce((s, i) => s + data.items[i.id] * i.price, 0);

    const submit = (e) => {
        e.preventDefault();
        form.post(route('preorder.submit', token), { preserveScroll: true });
    };

    const itemErrors = Object.entries(errors).filter(([k]) => k === 'items' || k.startsWith('items.')).map(([, v]) => v);

    return (
        <PublicShell
            title={session.name}
            shop={shop}
            footer={accepting && (
                <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
                    <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
                        <div>
                            <p className="text-xs text-muted-foreground">{unitCount} item{unitCount === 1 ? '' : 's'} · pay at pickup</p>
                            <p className="text-lg font-semibold tabular-nums">RM {formatMoney(total)}</p>
                        </div>
                        <Button type="submit" form="preorder-form" size="lg" disabled={form.processing || unitCount === 0}>
                            {form.processing ? 'Sending…' : 'Place order'}
                        </Button>
                    </div>
                </div>
            )}
        >
            <Card>
                <CardContent className="space-y-3 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pre-order</p>
                    <h1 className="text-xl font-semibold leading-tight">{session.name}</h1>
                    <PickupInfo session={session} />
                    {session.remarks && <p className="whitespace-pre-line rounded-md bg-muted p-3 text-sm">{session.remarks}</p>}
                </CardContent>
            </Card>

            {!accepting ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        <p className="font-medium">This pre-order is closed</p>
                        <p className="text-sm text-muted-foreground">We're no longer taking orders for this session{shop?.phone ? `. Questions? Call ${shop.phone}.` : '.'}</p>
                    </CardContent>
                </Card>
            ) : (
                <form id="preorder-form" onSubmit={submit} className="space-y-4">
                    <Card>
                        <CardContent className="divide-y p-0">
                            <p className="px-5 pb-2 pt-4 font-semibold">Choose your items</p>
                            {items.map((item) => {
                                const units = data.items[item.id] || 0;
                                const soldOut = item.left === 0;
                                const atLimit = units >= limitOf(item);
                                const initials = item.label.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                                return (
                                    <div key={item.id} className={cn('flex items-center gap-3 px-5 py-3', soldOut && 'opacity-50')}>
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                                            {item.image
                                                ? <img src={item.image} alt="" className="h-full w-full object-cover" />
                                                : <span className="text-sm font-semibold text-muted-foreground">{initials}</span>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium leading-snug">{item.label}</p>
                                            <p className="text-sm tabular-nums">RM {formatMoney(item.price)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {soldOut ? 'Sold out' : [
                                                    item.left !== null && item.left <= 20 ? `${item.left} left` : null,
                                                    item.max ? `max ${item.max} per order` : null,
                                                ].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                        {!soldOut && (
                                            <div className="flex items-center gap-1">
                                                <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={units === 0} onClick={() => setUnits(item, units - 1)} aria-label={`Fewer ${item.label}`}>
                                                    <Minus />
                                                </Button>
                                                <span className="w-8 text-center text-lg font-semibold tabular-nums">{units}</span>
                                                <Button type="button" variant={units ? 'default' : 'outline'} size="icon" className="h-9 w-9" disabled={atLimit} onClick={() => setUnits(item, units + 1)} aria-label={`More ${item.label}`}>
                                                    <Plus />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {itemErrors.length > 0 && (
                        <Alert variant="destructive"><AlertDescription>{itemErrors.join(' ')}</AlertDescription></Alert>
                    )}

                    <Card>
                        <CardContent className="space-y-4 p-5">
                            <p className="font-semibold">Your details</p>
                            <Field id="name" label="Name" error={errors.name}>
                                <Input id="name" autoComplete="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required maxLength={120} />
                            </Field>
                            <Field id="phone" label="Phone number" error={errors.phone}>
                                <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="012-345 6789" required />
                            </Field>
                            <Field id="address" label="Address" error={errors.address}>
                                <Textarea id="address" autoComplete="street-address" rows={3} value={data.address} onChange={(e) => setData('address', e.target.value)} required maxLength={500} />
                            </Field>
                            <Field id="notes" label="Note (optional)" error={errors.notes}>
                                <Textarea id="notes" rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} maxLength={500} placeholder="Anything we should know?" />
                            </Field>
                            {/* Honeypot: hidden from people, filled by bots. */}
                            <div className="hidden" aria-hidden="true">
                                <label htmlFor="website">Website</label>
                                <input id="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={(e) => setData('website', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {chosen.length > 0 && (
                        <Card>
                            <CardContent className="space-y-2 p-5 text-sm">
                                <p className="font-semibold">Your order</p>
                                {chosen.map((i) => (
                                    <div key={i.id} className="flex justify-between gap-3">
                                        <span>{data.items[i.id]} × {i.label}</span>
                                        <span className="tabular-nums">RM {formatMoney(data.items[i.id] * i.price)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between border-t pt-2 font-semibold">
                                    <span>Total (pay at pickup)</span>
                                    <span className="tabular-nums">RM {formatMoney(total)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </form>
            )}
        </PublicShell>
    );
}

function Field({ id, label, error, children }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
