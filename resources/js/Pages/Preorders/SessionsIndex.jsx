import { Link } from '@inertiajs/react';
import { CalendarDays, ClipboardList, MapPin, Plus } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import InventoryPage from '@/Components/inventory/InventoryPage';
import { FormStatusBadge, PublicLink, pickupText } from '@/Components/preorders/PreorderBits';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function SessionsIndex({ sessions = [] }) {
    const open = sessions.filter((s) => s.status === 'open');
    const closed = sessions.filter((s) => s.status === 'closed');

    return (
        <InventoryPage
            title="Pre-orders"
            description="Open a pre-order session, share its link, and customers order through the form. Collect and take payment on the POS."
            actions={(
                <Button asChild>
                    <Link href={route('preorders.create')}><Plus />New session</Link>
                </Button>
            )}
        >
            {sessions.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="font-medium">No pre-order sessions yet</p>
                            <p className="text-sm text-muted-foreground">Set what customers can order and where to pick up, then share the link.</p>
                        </div>
                        <Button asChild><Link href={route('preorders.create')}><Plus />New session</Link></Button>
                    </CardContent>
                </Card>
            )}

            {open.length > 0 && <SessionGrid title="Open" sessions={open} />}
            {closed.length > 0 && <SessionGrid title="Closed" sessions={closed} />}
        </InventoryPage>
    );
}

function SessionGrid({ title, sessions }) {
    return (
        <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
            </div>
        </div>
    );
}

function SessionCard({ session }) {
    const closed = session.status === 'closed';

    return (
        <Card className={cn('flex flex-col', closed && 'bg-muted/40')}>
            <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <Link href={route('preorders.show', session.id)} className="block truncate font-semibold hover:underline">
                            {session.name}
                        </Link>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />Pickup {pickupText(session) || '—'}
                        </p>
                        {session.pickup_location && (
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{session.pickup_location}</span>
                            </p>
                        )}
                    </div>
                    <FormStatusBadge session={session} accepting={session.accepting} />
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg border bg-background p-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Orders</p>
                        <p className="font-semibold tabular-nums">{session.orders_count}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">To collect</p>
                        <p className="font-semibold tabular-nums">{session.pending_count}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="font-semibold tabular-nums">RM {formatMoney(session.orders_total)}</p>
                    </div>
                </div>

                {!closed && <PublicLink url={session.public_url} />}

                <Button asChild className="mt-auto" variant={closed ? 'outline' : 'default'}>
                    <Link href={route('preorders.show', session.id)}><ClipboardList />View orders</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
