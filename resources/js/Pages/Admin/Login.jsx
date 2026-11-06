import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Loader2, ShieldCheck } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import GoogleButton from '@/Components/GoogleButton';

/** Master admin: sign in with an approved Google account that is marked master admin. */
export default function AdminLogin() {
    const { errors } = usePage().props;
    const [leaving, setLeaving] = useState(false);

    const signIn = () => {
        setLeaving(true);
        window.location.assign(route('auth.google', { intent: 'admin' }));
    };

    return (
        <GuestLayout>
            <Head title="Master admin login" />
            <div className="mx-auto w-full max-w-md py-10 md:py-20">
                <div className="space-y-6 rounded-lg bg-background p-6 shadow-xl md:p-8">
                    <div className="space-y-1">
                        <ShieldCheck className="h-8 w-8" />
                        <h1 className="text-2xl font-bold">Master admin</h1>
                        <p className="text-sm text-muted-foreground">Manage stores and users. Sign in with your Google account.</p>
                    </div>

                    <GoogleButton onClick={signIn} disabled={leaving}>
                        {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Continue with Google
                    </GoogleButton>

                    {errors.google && (
                        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{errors.google}</p>
                    )}

                    <p className="border-t pt-4 text-center text-xs text-muted-foreground">
                        Store staff? <Link href={route('login')} className="underline hover:text-foreground">Store login</Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
