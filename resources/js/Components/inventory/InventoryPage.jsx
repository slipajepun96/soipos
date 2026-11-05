import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Alert, AlertDescription } from '@/Components/ui/alert';

/**
 * Standard inventory page: title row with optional back link and actions,
 * flash message, then the page content.
 */
export default function InventoryPage({ title, description, backHref, actions, children }) {
    return (
        <AuthenticatedLayout>
            <Head title={title} />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                        {backHref && (
                            <Button variant="outline" size="icon" asChild className="mt-0.5 shrink-0">
                                <Link href={backHref} aria-label="Back">
                                    <ArrowLeft />
                                </Link>
                            </Button>
                        )}
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                            {description && (
                                <div className="mt-1 text-sm text-muted-foreground">{description}</div>
                            )}
                        </div>
                    </div>
                    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                </div>

                {children}
            </div>
        </AuthenticatedLayout>
    );
}

export function FlashMessage() {
    const { flash, errors } = usePage().props;
    const message = flash?.message || errors?.delete;
    const isError = flash?.type === 'error' || (!flash?.message && !!errors?.delete);
    const [hidden, setHidden] = useState(false);

    useEffect(() => setHidden(false), [message]);

    if (!message || hidden) return null;

    return (
        <Alert variant={isError ? 'destructive' : 'default'} className="pr-10">
            {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription>{message}</AlertDescription>
            <button
                type="button"
                onClick={() => setHidden(true)}
                className="absolute right-3 top-3 rounded-sm opacity-60 hover:opacity-100"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>
        </Alert>
    );
}
