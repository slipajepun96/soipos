import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { format, startOfMonth, subDays } from 'date-fns';
import { Ban, CalendarDays, Eye, FileText, Printer, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import InventoryPage from '@/Components/inventory/InventoryPage';
import DatePicker from '@/Components/inventory/DatePicker';
import SaleDetailDialog from '@/Components/sales/SaleDetailDialog';
import VoidSaleDialog from '@/Components/sales/VoidSaleDialog';
import { DocTypeBadge, PaymentStatusBadge } from '@/Components/sales/SaleBadges';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const ymd = (d) => format(d, 'yyyy-MM-dd');
const time = (iso) => (iso ? format(new Date(iso), 'HH:mm') : '');
const PAYMENT_METHODS = ['Cash', 'Card', 'E-Wallet', 'Bank Transfer'];

export default function SalesIndex({ filters, sales = [], summary }) {
    const [query, setQuery] = useState('');
    const [viewing, setViewing] = useState(null);
    const [voiding, setVoiding] = useState(null);

    const apply = (patch) => router.get(route('sales.index'), { ...filters, ...patch }, { preserveState: true, replace: true });

    const today = ymd(new Date());
    const presets = [
        { label: 'Today', from: today, to: today },
        { label: 'Yesterday', from: ymd(subDays(new Date(), 1)), to: ymd(subDays(new Date(), 1)) },
        { label: 'Last 7 days', from: ymd(subDays(new Date(), 6)), to: today },
        { label: 'This month', from: ymd(startOfMonth(new Date())), to: today },
    ];

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return sales;
        return sales.filter((s) => [s.receipt_no, s.customer_name, s.customer_company, s.customer_phone, s.cashier_name, s.payment_method]
            .some((v) => v && String(v).toLowerCase().includes(q)));
    }, [sales, query]);

    const period = filters.from === filters.to
        ? formatDate(filters.from)
        : `${formatDate(filters.from)} – ${formatDate(filters.to)}`;

    return (
        <InventoryPage
            title="Sales"
            description={`Receipts and invoices for ${period}`}
            actions={(
                <>
                    <Button variant="outline" asChild>
                        <Link href={route('sales.events.index')}>
                            <CalendarDays />
                            Events
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={route('sales.invoices.index')}>
                            <FileText />
                            Invoices
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={route('sales.pos')}>
                            <ShoppingCart />
                            Open POS
                        </Link>
                    </Button>
                </>
            )}
        >
            <Card>
                <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-end">
                    <div className="grid flex-1 grid-cols-2 gap-4 sm:max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="from">From</Label>
                            <DatePicker id="from" value={filters.from} onChange={(v) => v && apply({ from: v, to: v > filters.to ? v : filters.to })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="to">To</Label>
                            <DatePicker id="to" value={filters.to} onChange={(v) => v && apply({ to: v, from: v < filters.from ? v : filters.from })} />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {presets.map((p) => (
                            <Button
                                key={p.label}
                                variant={filters.from === p.from && filters.to === p.to ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => apply({ from: p.from, to: p.to })}
                            >
                                {p.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat label="Net sales" value={`RM ${formatMoney(summary.net)}`} hint={`${summary.count} sale${summary.count === 1 ? '' : 's'}${summary.discount > 0 ? ` · RM ${formatMoney(summary.discount)} discount` : ''}`} strong />
                <Stat label="Collected" value={`RM ${formatMoney(summary.collected)}`} hint="Payments received in this period" />
                <Stat label="On credit" value={`RM ${formatMoney(summary.on_credit)}`} hint="Unpaid from these sales" alert={summary.on_credit > 0} />
                <Stat label="Voided" value={summary.voided} />
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {summary.by_method.map((m) => (
                    <Card key={m.method}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-medium">{m.method}</p>
                                <p className="text-xs text-muted-foreground">{m.count} payment{m.count === 1 ? '' : 's'}</p>
                            </div>
                            <p className="font-semibold tabular-nums">{formatMoney(m.total)}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <div className="border-b p-4">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search number, customer…" className="pl-8" />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-4">Number</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total (RM)</TableHead>
                            <TableHead className="w-36 pr-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((sale) => {
                            const voided = sale.status === 'voided';
                            return (
                                <TableRow key={sale.id} className={cn(voided && 'text-muted-foreground')}>
                                    <TableCell className="pl-4">
                                        <div className="flex items-center gap-2">
                                            <span className={cn('font-medium', voided && 'line-through')}>{sale.receipt_no}</span>
                                            <DocTypeBadge sale={sale} />
                                        </div>
                                        {sale.event && (
                                            <Link href={route('sales.events.show', sale.event.id)} className="mt-0.5 flex items-center gap-1 text-xs underline-offset-4 hover:underline">
                                                <CalendarDays className="h-3 w-3" />{sale.event.name}
                                            </Link>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                            {filters.from !== filters.to && `${formatDate(sale.sale_date)} `}{time(sale.created_at)} · {sale.cashier_name || '—'} · {sale.items_count} item{sale.items_count === 1 ? '' : 's'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{sale.customer_company || sale.customer_name || 'Walk-in customer'}</div>
                                        {sale.customer_phone && <div className="text-xs text-muted-foreground">{sale.customer_phone}</div>}
                                    </TableCell>
                                    <TableCell>{sale.payment_method || 'Pay later'}</TableCell>
                                    <TableCell>
                                        <PaymentStatusBadge sale={sale} />
                                        {!voided && sale.balance_due > 0 && (
                                            <div className="mt-1 text-xs text-muted-foreground tabular-nums">Due {formatMoney(sale.balance_due)}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className={cn('text-right font-medium tabular-nums', voided && 'line-through')}>
                                        {formatMoney(sale.total)}
                                    </TableCell>
                                    <TableCell className="pr-4">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(sale)} aria-label="View">
                                                <Eye />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                <a
                                                    href={route(sale.document_type === 'invoice' ? 'sales.invoice' : 'sales.receipt', sale.id)}
                                                    target="_blank" rel="noopener"
                                                    aria-label={sale.document_type === 'invoice' ? 'Invoice PDF' : 'Receipt'}
                                                >
                                                    {sale.document_type === 'invoice' ? <FileText /> : <Printer />}
                                                </a>
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                disabled={voided}
                                                onClick={() => setVoiding(sale)}
                                                aria-label="Void"
                                            >
                                                <Ban />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                    {sales.length === 0 ? 'No sales in this period.' : 'No sales match your search.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                    {rows.length} of {sales.length} sales
                </div>
            </Card>

            <SaleDetailDialog
                sale={viewing}
                paymentMethods={PAYMENT_METHODS}
                onClose={() => setViewing(null)}
                onVoid={(s) => { setViewing(null); setVoiding(s); }}
            />
            <VoidSaleDialog sale={voiding} onClose={() => setVoiding(null)} />
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
