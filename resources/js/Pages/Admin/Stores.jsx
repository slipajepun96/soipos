import { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { LogIn, Pencil, Plus, Store as StoreIcon, Users } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { formatMoney } from '@/lib/format';

export default function Stores({ stores }) {
    const [editing, setEditing] = useState(null); // null = closed, {} = new, store = edit

    return (
        <AdminLayout
            title="Stores"
            actions={<Button onClick={() => setEditing({})}><Plus />New store</Button>}
        >
            <p className="text-sm text-muted-foreground">
                Each store has its own products, prices, stock, sales, events, pre-orders, suppliers and settings.
                Staff choose their store when they log in. As master admin you can open any open store.
            </p>

            {stores.length === 0 && (
                <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No stores yet. Create the first one.</CardContent></Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {stores.map((s) => (
                    <Card key={s.id} className={s.is_active ? '' : 'opacity-70'}>
                        <CardContent className="space-y-4 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="flex items-center gap-2 text-lg font-semibold">
                                        <StoreIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="truncate">{s.name}</span>
                                    </p>
                                    <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                                        {s.short_code && <Badge variant="outline" className="font-mono" title="Short code used in document numbers">{s.short_code}</Badge>}
                                        <span className="truncate">{s.code}</span>
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <Badge variant={s.is_active ? 'secondary' : 'outline'}>{s.is_active ? 'Open' : 'Closed'}</Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}><Pencil /></Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <Stat label="Users" value={s.users_count} />
                                <Stat label="Products" value={s.products_count} />
                                <Stat label="Sales" value={s.sales_count} />
                                <Stat label="Revenue" value={`RM ${formatMoney(s.revenue)}`} />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <Link href={route('admin.users.index', { store: s.id })} className="inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline">
                                    <Users className="h-4 w-4" />Manage users
                                </Link>
                                {s.is_active && (
                                    <Button asChild size="sm">
                                        <Link href={route('admin.stores.enter', s.id)} method="post" as="button"><LogIn />Open store</Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <StoreDialog store={editing} onClose={() => setEditing(null)} />
        </AdminLayout>
    );
}

function Stat({ label, value }) {
    return (
        <div className="rounded-md bg-muted px-2 py-2">
            <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
    );
}

function StoreDialog({ store, onClose }) {
    const isNew = store && !store.id;
    const form = useForm({ name: '', code: '', short_code: '', is_active: true });
    // New store: suggest a short code from the name until the admin types their own.
    const [shortTouched, setShortTouched] = useState(false);

    // Load the store into the form each time the dialog opens.
    const [loadedFor, setLoadedFor] = useState(null);
    if (store && loadedFor !== store) {
        setLoadedFor(store);
        form.setData({ name: store.name ?? '', code: store.code ?? '', short_code: store.short_code ?? '', is_active: store.is_active ?? true });
        form.clearErrors();
        setShortTouched(Boolean(store.id));
    }

    const submit = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => { onClose(); form.reset(); } };
        isNew ? form.post(route('admin.stores.store'), options) : form.put(route('admin.stores.update', store.id), options);
    };

    return (
        <Dialog open={Boolean(store)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>{isNew ? 'New store' : `Edit ${store?.name}`}</DialogTitle>
                        <DialogDescription>{isNew ? 'A new, empty store. Add its products after assigning users.' : 'Rename, change its code, or close the store.'}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="store-name">Store name</Label>
                        <Input
                            id="store-name"
                            value={form.data.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                form.setData((d) => ({ ...d, name, short_code: shortTouched ? d.short_code : suggestShortCode(name) }));
                            }}
                            placeholder="e.g. Kedai Kuantan"
                            autoFocus
                        />
                        {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="store-short-code">Short code</Label>
                        <Input
                            id="store-short-code"
                            value={form.data.short_code}
                            onChange={(e) => { setShortTouched(true); form.setData('short_code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); }}
                            placeholder="e.g. KTN"
                            maxLength={6}
                            className="font-mono uppercase"
                        />
                        <p className="text-xs text-muted-foreground">
                            Starts every document number: invoices, receipts, stock in/out and pre-orders, e.g.{' '}
                            <span className="font-mono">{form.data.short_code || 'KTN'}-SIN{new Date().getFullYear().toString().slice(-2)}0000001</span>.
                            2–6 letters or numbers.{!isNew && ' Changing it only affects new documents.'}
                        </p>
                        {form.errors.short_code && <p className="text-sm text-destructive">{form.errors.short_code}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="store-code">Link code</Label>
                        <Input id="store-code" value={form.data.code} onChange={(e) => form.setData('code', e.target.value.toLowerCase())} placeholder="Made from the name if empty" className="font-mono" />
                        <p className="text-xs text-muted-foreground">Short unique name for the store, e.g. <span className="font-mono">{form.data.code || 'kedai-kuantan'}</span></p>
                        {form.errors.code && <p className="text-sm text-destructive">{form.errors.code}</p>}
                    </div>
                    {!isNew && (
                        <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                            <input type="checkbox" className="mt-0.5 rounded border-input" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                            <span>
                                <span className="font-medium">Store is open</span>
                                <span className="block text-xs text-muted-foreground">Closed stores disappear from the login page and their public links stop working. Data is kept.</span>
                            </span>
                        </label>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={form.processing}>{isNew ? 'Create store' : 'Save'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** "Kedai Kuantan" -> "KK", "Kuantan" -> "KUA" (same rule as the server; the server keeps it unique). */
function suggestShortCode(name) {
    const words = name.normalize('NFD').replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    let code = (words.length > 1 ? words.slice(0, 4).map((w) => w[0]).join('') : words[0].slice(0, 3)).toUpperCase();
    if (!/^[A-Z]/.test(code)) code = `S${code}`;
    return code.slice(0, 6);
}
