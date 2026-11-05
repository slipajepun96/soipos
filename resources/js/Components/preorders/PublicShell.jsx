import { Head } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const pickupDate = (value) => (value ? format(new Date(`${value}T00:00:00`), 'EEEE, d MMMM yyyy') : null);

/** Plain layout for customer-facing pages (no login, no app navigation). */
export function PublicShell({ title, shop, children, footer }) {
    return (
        <div className="min-h-[100dvh] bg-muted/40">
            <Head title={title} />
            <header className="border-b bg-background">
                <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
                    <span className="font-semibold tracking-tight">{shop?.name || 'Pre-order'}</span>
                    {shop?.phone && <a href={`tel:${shop.phone}`} className="text-sm text-muted-foreground hover:underline">{shop.phone}</a>}
                </div>
            </header>
            <main className="mx-auto max-w-xl space-y-4 px-4 py-5">{children}</main>
            {footer}
        </div>
    );
}

export function PickupInfo({ session }) {
    return (
        <div className="space-y-2 text-sm">
            {session.pickup_date && (
                <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" /><span><span className="font-medium">{pickupDate(session.pickup_date)}</span>{session.pickup_time && <span className="text-muted-foreground"> · {session.pickup_time}</span>}</span></p>
            )}
            {session.pickup_location && (
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{session.pickup_location}</p>
            )}
            {session.closes_at && (
                <p className="flex items-start gap-2 text-muted-foreground">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                    Order by {format(new Date(session.closes_at), "d MMM yyyy, h:mm a")}
                </p>
            )}
        </div>
    );
}
