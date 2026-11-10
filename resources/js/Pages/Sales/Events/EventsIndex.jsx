import { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { BarChart3, CalendarDays, Lock, LockOpen, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import InventoryPage from '@/Components/inventory/InventoryPage';
import DatePicker from '@/Components/inventory/DatePicker';
import FormField from '@/Components/inventory/FormField';
import { formatDate, formatMoney, today } from '@/lib/format';
import { cn } from '@/lib/utils';

export const eventDates = (e) => (e.start_date === e.end_date
    ? formatDate(e.start_date)
    : `${formatDate(e.start_date)} – ${formatDate(e.end_date)}`);

export default function EventsIndex({ events = [], partnerStores = [] }) {
    const [editing, setEditing] = useState(null); // null | 'new' | event

    const open = events.filter((e) => e.status === 'open');
    const closed = events.filter((e) => e.status === 'closed');

    return (
        <InventoryPage
            title="Events"
            description="Bazaars, expos and roadshows. Pick an open event on the POS to tag its sales, then view the report."
            backHref={route('sales.index')}
            actions={(
                <Button onClick={() => setEditing('new')}>
                    <Plus />
                    New event
                </Button>
            )}
        >
            {events.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                        <CalendarDays className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="font-medium">No events yet</p>
                            <p className="text-sm text-muted-foreground">Create one before the event starts, then select it on the POS.</p>
                        </div>
                        <Button onClick={() => setEditing('new')}><Plus />New event</Button>
                    </CardContent>
                </Card>
            )}

            {open.length > 0 && <EventGrid title="Open" events={open} onEdit={setEditing} />}
            {closed.length > 0 && <EventGrid title="Closed" events={closed} onEdit={setEditing} />}

            <EventFormDialog event={editing} partnerStores={partnerStores} onClose={() => setEditing(null)} />
        </InventoryPage>
    );
}

function EventGrid({ title, events, onEdit }) {
    return (
        <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => <EventCard key={event.id} event={event} onEdit={() => onEdit(event)} />)}
            </div>
        </div>
    );
}

function EventCard({ event, onEdit }) {
    const closed = event.status === 'closed';
    const toggle = () => router.post(route('sales.events.toggle', event.id), {}, { preserveScroll: true });
    const remove = () => {
        if (window.confirm(`Delete "${event.name}"?`)) router.delete(route('sales.events.destroy', event.id), { preserveScroll: true });
    };

    return (
        <Card className={cn('flex flex-col', closed && 'bg-muted/40')}>
            <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate font-semibold">{event.name}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />{eventDates(event)}
                        </p>
                        {event.location && (
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />{event.location}
                            </p>
                        )}
                        {event.joint_role && (
                            <Badge variant="secondary" className="mt-1.5">
                                {event.joint_role === 'host' ? 'Joint event · host' : `Joint event · hosted by ${event.joint_host}`}
                            </Badge>
                        )}
                    </div>
                    <Badge variant={closed ? 'outline' : 'default'}>{closed ? 'Closed' : 'Open'}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg border bg-background p-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Net sales</p>
                        <p className="font-semibold tabular-nums">RM {formatMoney(event.net)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Transactions</p>
                        <p className="font-semibold tabular-nums">{event.sales_count}</p>
                    </div>
                </div>

                <div className="mt-auto flex items-center gap-1">
                    <Button size="sm" asChild className="mr-auto">
                        <Link href={route('sales.events.show', event.id)}>
                            <BarChart3 />
                            Report
                        </Link>
                    </Button>
                    {event.joint_role !== 'partner' && (<>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit">
                        <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle} aria-label={closed ? 'Reopen' : 'Close'} title={closed ? 'Reopen' : 'Close event'}>
                        {closed ? <LockOpen /> : <Lock />}
                    </Button>
                    </>)}
                    {!event.has_sales && !event.joint_role && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={remove} aria-label="Delete">
                            <Trash2 />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function EventFormDialog({ event, partnerStores, onClose }) {
    if (!event) return null;
    return <EventForm key={event === 'new' ? 'new' : event.id} event={event === 'new' ? null : event} partnerStores={partnerStores} onClose={onClose} />;
}

function EventForm({ event, partnerStores, onClose }) {
    // Stores you can pick, plus any partner already on the event (e.g. added by a master admin).
    const current = event?.partner_stores ?? [];
    const storeChoices = [...partnerStores, ...current.filter((p) => !partnerStores.some((s) => s.id === p.id))];
    const form = useForm({
        name: event?.name ?? '',
        location: event?.location ?? '',
        start_date: event?.start_date ?? today(),
        end_date: event?.end_date ?? today(),
        notes: event?.notes ?? '',
        partner_store_ids: current.map((p) => p.id),
    });
    const { data, setData, errors } = form;
    const togglePartner = (id) => setData('partner_store_ids', data.partner_store_ids.includes(id)
        ? data.partner_store_ids.filter((x) => x !== id)
        : [...data.partner_store_ids, id]);

    const submit = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };
        if (event) form.put(route('sales.events.update', event.id), options);
        else form.post(route('sales.events.store'), options);
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>{event ? 'Edit event' : 'New event'}</DialogTitle>
                        <DialogDescription>Sales made on the POS while this event is selected are grouped into its report.</DialogDescription>
                    </DialogHeader>
                    <FormField label="Event name" htmlFor="name" required error={errors.name}>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Pahang Agro Expo 2026" autoFocus />
                    </FormField>
                    <FormField label="Location" htmlFor="location" error={errors.location}>
                        <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} placeholder="e.g. SACC Convention Centre, Kuantan" />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Start date" htmlFor="start_date" required error={errors.start_date}>
                            <DatePicker id="start_date" value={data.start_date} onChange={(v) => v && setData((d) => ({ ...d, start_date: v, end_date: d.end_date < v ? v : d.end_date }))} />
                        </FormField>
                        <FormField label="End date" htmlFor="end_date" required error={errors.end_date}>
                            <DatePicker id="end_date" value={data.end_date} onChange={(v) => v && setData('end_date', v)} />
                        </FormField>
                    </div>
                    <FormField label="Notes" htmlFor="notes" error={errors.notes}>
                        <Textarea id="notes" rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Booth no., rental, team on duty…" />
                    </FormField>
                    {storeChoices.length > 0 && (
                        <FormField label="Joint with other stores" error={errors.partner_store_ids || errors['partner_store_ids.0']}>
                            <div className="space-y-1.5 rounded-md border p-2">
                                {storeChoices.map((s) => (
                                    <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
                                        <input
                                            type="checkbox"
                                            className="rounded border-input text-primary focus:ring-ring"
                                            checked={data.partner_store_ids.includes(s.id)}
                                            onChange={() => togglePartner(s.id)}
                                        />
                                        {s.name}
                                        {s.short_code && <span className="text-xs text-muted-foreground">({s.short_code})</span>}
                                    </label>
                                ))}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Ticked stores sell with you at this event. You host: your POS sells their products and all payments come to you;
                                you settle with them after the event.
                            </p>
                        </FormField>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={form.processing}>{event ? 'Save changes' : 'Create event'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
