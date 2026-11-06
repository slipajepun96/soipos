import { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Loader2, Store } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import GoogleButton from '@/Components/GoogleButton';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

const LAST_STORE = 'soipos.login.store';

/** Store staff: choose the store, then sign in with an approved Google account. */
export default function Login({ status, stores = [] }) {
    const { errors } = usePage().props;
    const [storeId, setStoreId] = useState('');
    const [storeError, setStoreError] = useState(errors.store_id || '');
    const [leaving, setLeaving] = useState(false);

    // Pre-select the store used last time on this device (or the only store).
    // After "Wrong store", start with no store so the person chooses again.
    useEffect(() => {
        if (errors.store_id) {
            try { window.localStorage.removeItem(LAST_STORE); } catch { /* ignore */ }
            return;
        }
        let last = null;
        try { last = window.localStorage.getItem(LAST_STORE); } catch { /* ignore */ }
        const pick = stores.find((s) => s.id === last)?.id ?? (stores.length === 1 ? stores[0].id : '');
        if (pick) setStoreId(pick);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const signIn = () => {
        if (!storeId) {
            setStoreError('Select your store.');
            return;
        }
        try { window.localStorage.setItem(LAST_STORE, storeId); } catch { /* ignore */ }
        setLeaving(true);
        window.location.assign(route('auth.google', { intent: 'store', store_id: storeId }));
    };

    return (
        <GuestLayout>
            <Head title="Log in" />
            <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 py-8 md:py-16 lg:grid-cols-2 lg:gap-16">
                <div className="flex flex-col justify-center">
                    <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">SoiPOS</h1>
                    <p className="mt-2 text-lg text-muted-foreground">v.0.1</p>
                </div>

                <div className="w-full min-w-0 space-y-6 md:rounded-lg md:bg-background md:p-8 md:shadow-xl">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold">Login</h2>
                        <p className="text-sm text-muted-foreground">Choose your store, then sign in with your Google account.</p>
                    </div>

                    {status && <p className="text-sm font-medium">{status}</p>}

                    <div className="space-y-2">
                        <Label htmlFor="store_id">Store</Label>
                        <Select value={storeId} onValueChange={(v) => { setStoreId(v); setStoreError(''); }}>
                            <SelectTrigger id="store_id" className="h-11 min-w-0 gap-2" aria-invalid={storeError ? true : undefined}>
                                <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate text-left"><SelectValue placeholder="Select your store" /></span>
                            </SelectTrigger>
                            <SelectContent className="max-w-[calc(100vw-2rem)]">
                                {stores.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">No stores yet</div>}
                                {stores.map((s) => <SelectItem key={s.id} value={s.id} className="whitespace-normal">{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {storeError && <p className="text-sm font-medium text-destructive">{storeError}</p>}
                    </div>

                    <GoogleButton onClick={signIn} disabled={leaving}>
                        {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Continue with Google
                    </GoogleButton>

                    {errors.google && (
                        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{errors.google}</p>
                    )}

                    <p className="border-t pt-4 text-center text-xs text-muted-foreground">
                        Only Google accounts approved by your administrator can sign in.
                        <br />
                        Master admin? <Link href={route('admin.login')} className="underline hover:text-foreground">Admin login</Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
