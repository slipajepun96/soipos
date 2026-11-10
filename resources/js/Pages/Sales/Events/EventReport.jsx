import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Download, MapPin } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import InventoryPage from '@/Components/inventory/InventoryPage';
import SaleDetailDialog from '@/Components/sales/SaleDetailDialog';
import JointEventPanel from '@/Components/sales/JointEventPanel';
import { DocTypeBadge, PaymentStatusBadge } from '@/Components/sales/SaleBadges';
import { formatDate, formatMoney, formatQty } from '@/lib/format';
import { cn } from '@/lib/utils';
import { eventDates } from './EventsIndex';

const PAYMENT_METHODS = ['Cash', 'Card', 'E-Wallet', 'Bank Transfer'];

export default function EventReport({ event, summary, by_method = [], by_day = [], products = [], sales = [], joint = null, eventProducts = [], productOptions = [] }) {
    const [viewing, setViewing] = useState(null);
    const maxDay = Math.max(1, ...by_day.map((d) => d.net));
    const revenueTotal = products.reduce((s, p) => s + p.revenue, 0);

    return (
        <InventoryPage
            title={event.name}
            description={(
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{eventDates(event)}</span>
                    {event.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{event.location}</span>}
                    <Badge variant={event.status === 'closed' ? 'outline' : 'default'}>{event.status === 'closed' ? 'Closed' : 'Open'}</Badge>
                </span>
            )}
            backHref={route('sales.events.index')}
            actions={(
                <Button variant="outline" asChild>
                    <a href={route('sales.events.pdf', event.id)}>
                        <Download />
                        Download PDF
                    </a>
                </Button>
            )}
        >
            <JointEventPanel
                event={event}
                joint={joint}
                eventProducts={eventProducts}
                productOptions={productOptions}
            />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat label="Net sales" value={`RM ${formatMoney(summary.net)}`} hint={summary.discount > 0 ? `After RM ${formatMoney(summary.discount)} discount` : undefined} strong />
                <Stat label="Transactions" value={summary.count} hint={`Avg RM ${formatMoney(summary.average)} per sale`} />
                <Stat label="Items sold" value={formatQty(summary.items_sold)} hint={`${products.length} product${products.length === 1 ? '' : 's'}`} />
                <Stat label="Gross profit" value={`RM ${formatMoney(summary.profit)}`} hint={`${summary.margin}% margin · cost RM ${formatMoney(summary.cost)}`} />
                <Stat label="Collected" value={`RM ${formatMoney(summary.collected)}`} />
                <Stat label="Outstanding" value={`RM ${formatMoney(summary.outstanding)}`} alert={summary.outstanding > 0} />
                <Stat label="Voided" value={summary.voided} hint={summary.voided ? `RM ${formatMoney(summary.voided_total)}` : undefined} />
                <Stat label="Days with sales" value={by_day.length} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-base">By payment method</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {by_method.map((m) => {
                            const pct = summary.collected > 0 ? (m.total / summary.collected) * 100 : 0;
                            return (
                                <div key={m.method} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>{m.method} <span className="text-muted-foreground">· {m.count}</span></span>
                                        <span className="font-medium tabular-nums">RM {formatMoney(m.total)}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">By day</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {by_day.length === 0 && <p className="text-sm text-muted-foreground">No sales yet.</p>}
                        {by_day.map((d) => (
                            <div key={d.date} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>{format(new Date(`${d.date}T00:00:00`), 'EEE, dd/MM')} <span className="text-muted-foreground">· {d.count} sale{d.count === 1 ? '' : 's'}</span></span>
                                    <span className="font-medium tabular-nums">RM {formatMoney(d.net)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted">
                                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(d.net / maxDay) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Products sold</CardTitle></CardHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Product</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Revenue (RM)</TableHead>
                            <TableHead className="hidden text-right sm:table-cell">Share</TableHead>
                            <TableHead className="text-right">Cost (RM)</TableHead>
                            <TableHead className="pr-6 text-right">Profit (RM)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((p) => (
                            <TableRow key={p.product_id ?? `custom-${p.product_name}`}>
                                <TableCell className="pl-6 font-medium">{p.product_name}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatQty(p.quantity)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatMoney(p.revenue)}</TableCell>
                                <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                                    {revenueTotal > 0 ? `${((p.revenue / revenueTotal) * 100).toFixed(1)}%` : '—'}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">{formatMoney(p.cost)}</TableCell>
                                <TableCell className={cn('pr-6 text-right font-medium tabular-nums', p.profit < 0 && 'text-destructive')}>{formatMoney(p.profit)}</TableCell>
                            </TableRow>
                        ))}
                        {products.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No products sold yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                    {products.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell className="pl-6">Total <span className="font-normal text-muted-foreground">(before order discounts)</span></TableCell>
                                <TableCell className="text-right tabular-nums">{formatQty(summary.items_sold)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatMoney(revenueTotal)}</TableCell>
                                <TableCell className="hidden sm:table-cell" />
                                <TableCell className="text-right tabular-nums">{formatMoney(summary.cost)}</TableCell>
                                <TableCell className="pr-6 text-right tabular-nums">{formatMoney(revenueTotal - summary.cost)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-base">Transactions</CardTitle></CardHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Number</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="pr-6 text-right">Total (RM)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.map((s) => {
                            const voided = s.status === 'voided';
                            return (
                                <TableRow key={s.id} className={cn('cursor-pointer', voided && 'text-muted-foreground')} onClick={() => setViewing(s)}>
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-2">
                                            <span className={cn('font-medium', voided && 'line-through')}>{s.receipt_no}</span>
                                            <DocTypeBadge sale={s} />
                                        </div>
                                        <div className="text-xs text-muted-foreground">{formatDate(s.sale_date)} {format(new Date(s.created_at), 'HH:mm')} · {s.cashier_name}</div>
                                    </TableCell>
                                    <TableCell>{s.customer_company || s.customer_name}</TableCell>
                                    <TableCell>{s.payment_method || 'Pay later'}</TableCell>
                                    <TableCell><PaymentStatusBadge sale={s} /></TableCell>
                                    <TableCell className={cn('pr-6 text-right font-medium tabular-nums', voided && 'line-through')}>{formatMoney(s.total)}</TableCell>
                                </TableRow>
                            );
                        })}
                        {sales.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No transactions yet. Select this event on the POS to start.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {event.notes && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
                    <CardContent className="whitespace-pre-line text-sm">{event.notes}</CardContent>
                </Card>
            )}

            <SaleDetailDialog sale={viewing} paymentMethods={PAYMENT_METHODS} onClose={() => setViewing(null)} />
        </InventoryPage>
    );
}

function Stat({ label, value, hint, strong = false, alert = false }) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className={cn('mt-1 text-2xl tabular-nums', strong ? 'font-bold' : 'font-semibold', alert && 'text-destructive')}>{value}</p>
                {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            </CardContent>
        </Card>
    );
}
