import { useMemo, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

const ALL = 'all';

export default function Users({ users, stores }) {
    const me = usePage().props.auth.user;
    const [editing, setEditing] = useState(null);
    const [storeFilter, setStoreFilter] = useState(() => {
        const id = new URLSearchParams(window.location.search).get('store');
        return stores.some((s) => s.id === id) ? id : ALL;
    });

    const shown = useMemo(
        () => (storeFilter === ALL ? users : users.filter((u) => u.store_ids.includes(storeFilter))),
        [users, storeFilter],
    );

    const remove = (user) => {
        if (!window.confirm(`Remove ${user.name} (${user.email})? This Google account will no longer be allowed to sign in.`)) return;
        router.delete(route('admin.users.destroy', user.id), { preserveScroll: true });
    };

    return (
        <AdminLayout title="Users" actions={<Button onClick={() => setEditing({})}><Plus />Approve account</Button>}>
            <div className="flex flex-wrap items-center gap-3">
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                    <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All stores</SelectItem>
                        {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">{shown.length} user{shown.length === 1 ? '' : 's'}</span>
            </div>

            <Card>
                <CardContent className="divide-y p-0">
                    {shown.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No users.</p>}
                    {shown.map((u) => (
                        <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                            {u.avatar
                                ? <img src={u.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full" referrerPolicy="no-referrer" />
                                : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{u.name.charAt(0).toUpperCase()}</span>}
                            <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-2 font-medium">
                                    {u.name}
                                    {u.is_master_admin && <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" />Master admin</Badge>}
                                    {!u.is_active && <Badge variant="destructive">Blocked</Badge>}
                                    {u.id === me.id && <Badge variant="outline">You</Badge>}
                                </p>
                                <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    {u.email}
                                    <span className="text-xs">{u.google_linked ? '· signed in with Google' : '· has not signed in yet'}</span>
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    {u.store_names.length
                                        ? u.store_names.map((n) => <Badge key={n} variant="outline" className="font-normal">{n}</Badge>)
                                        : u.is_master_admin
                                            ? <span className="text-xs text-muted-foreground">All stores (master admin)</span>
                                            : <span className="text-xs text-destructive">No store assigned: cannot log in to the POS</span>}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setEditing(u)} aria-label={`Edit ${u.name}`}><Pencil /></Button>
                                {u.id !== me.id && (
                                    <Button variant="ghost" size="icon" onClick={() => remove(u)} aria-label={`Delete ${u.name}`}><Trash2 /></Button>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <UserDialog user={editing} stores={stores} isSelf={editing?.id === me.id} defaultStore={storeFilter === ALL ? null : storeFilter} onClose={() => setEditing(null)} />
        </AdminLayout>
    );
}

function UserDialog({ user, stores, isSelf, defaultStore, onClose }) {
    const isNew = user && !user.id;
    const form = useForm({ name: '', email: '', store_ids: [], is_master_admin: false, is_active: true });

    const [loadedFor, setLoadedFor] = useState(null);
    if (user && loadedFor !== user) {
        setLoadedFor(user);
        form.setData({
            name: user.name ?? '',
            email: user.email ?? '',
            store_ids: user.store_ids ?? (defaultStore ? [defaultStore] : []),
            is_master_admin: user.is_master_admin ?? false,
            is_active: user.is_active ?? true,
        });
        form.clearErrors();
    }

    const toggleStore = (id) => form.setData('store_ids', form.data.store_ids.includes(id)
        ? form.data.store_ids.filter((x) => x !== id)
        : [...form.data.store_ids, id]);

    const submit = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => { onClose(); form.reset(); } };
        isNew ? form.post(route('admin.users.store'), options) : form.put(route('admin.users.update', user.id), options);
    };

    const storeError = form.errors.store_ids || Object.entries(form.errors).find(([k]) => k.startsWith('store_ids.'))?.[1];

    return (
        <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>{isNew ? 'Approve a Google account' : `Edit ${user?.name}`}</DialogTitle>
                        <DialogDescription>Approve a Google account. The person signs in with Google and picks one of their stores. Other Google accounts are not allowed in.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="u-name">Name</Label>
                            <Input id="u-name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} autoFocus />
                            {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="u-email">Google account email</Label>
                            <Input id="u-email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value.toLowerCase())} placeholder="name@gmail.com" />
                            {form.errors.email && <p className="text-sm text-destructive">{form.errors.email}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Stores this user can log in to</Label>
                        <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                            {stores.length === 0 && <p className="p-2 text-sm text-muted-foreground">Create a store first.</p>}
                            {stores.map((s) => (
                                <label key={s.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                                    <input type="checkbox" className="rounded border-input" checked={form.data.store_ids.includes(s.id)} onChange={() => toggleStore(s.id)} />
                                    <span className="flex-1">{s.name}</span>
                                    {!s.is_active && <Badge variant="outline" className="font-normal">Closed</Badge>}
                                </label>
                            ))}
                        </div>
                        {storeError && <p className="text-sm text-destructive">{storeError}</p>}
                    </div>

                    {isSelf ? (
                        <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">You cannot remove your own master admin access or block yourself.</p>
                    ) : (
                        <div className="space-y-2">
                            <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                                <input type="checkbox" className="mt-0.5 rounded border-input" checked={form.data.is_master_admin} onChange={(e) => form.setData('is_master_admin', e.target.checked)} />
                                <span><span className="font-medium">Master admin</span><span className="block text-xs text-muted-foreground">Can create stores and users from the admin login.</span></span>
                            </label>
                            {!isNew && (
                                <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                                    <input type="checkbox" className="mt-0.5 rounded border-input" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} />
                                    <span><span className="font-medium">Approved</span><span className="block text-xs text-muted-foreground">Untick to block this Google account from signing in anywhere.</span></span>
                                </label>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={form.processing}>{isNew ? 'Approve' : 'Save'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
