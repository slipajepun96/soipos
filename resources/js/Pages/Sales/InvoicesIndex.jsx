import { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Eye, FileText, Plus, Search } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import InventoryPage from '@/Components/inventory/InventoryPage';
import SaleDetailDialog from '@/Components/sales/SaleDetailDialog';
import VoidSaleDialog from '@/Components/sales/VoidSaleDialog';
import { PaymentStatusBadge } from '@/Components/sales/SaleBadges';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const FILTERS = [
    { key: 'outstanding', label: 'Outstanding', test: (i) => i.status === 'completed' && i.balance_due > 0 },
    { key: 'overdue', label: 'Overdue', test: (i) => i.is_overdue },
    { key: 'paid', label: 'Paid', test: (i) => i.status === 'completed' && i.payment_status === 'paid' },
    { key: 'voided', label: 'Voided', test: (i) => i.status === 'voided' },
    { key: 'all', label: 'All', test: () => true },
];

export default function InvoicesIndex({ invoices = [], summary, paymentMethods = [] }) {
    const [filter, setFilter] = useState('outstanding');
    const [query, setQuery] = useState('');
    const [viewing, setViewing] = useState(null);
    const [voiding, setVoiding] = useState(null);

    const counts = useMemo(
        () => Object.fromEntries(FILTERS.map((f) => [f.key, invoices.filter(f.test).length])),
        [invoices],
    );

    const rows = useMemo(() => {
        const test = FILTERS.find((f) => f.key === filter).test;
        const q = query.trim().toLowerCase();
        return invoices.filter((i) => test(i) && (!q || [i.receipt_no, i.customer_name, i.customer_company, i.customer_phone, i.customer_email]
            .some((v) => v && String(v).toLowerCase().includes(q))));
    }, [invoices, filter, query]);

    return (
        <InventoryPage
            title="Invoices"
            description="Invoices issued to customers and what is still owed."
            backHref={route('sales.index')}
            actions={(
                <Button asChild>
                    <Link href={route('sales.invoices.create')}>
                        <Plus />
                        New invoice
                    </Link>
                </Button>
            )}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat label="Outstanding" value={`RM ${formatMoney(summary.outstanding)}`} hint={`${summary.outstanding_count} invoice${summary.outstanding_count === 1 ? '' : 's'} unpaid`} strong />
                <Stat label="Overdue" value={`RM ${formatMoney(summary.overdue)}`} hint={`${summary.overdue_count} past due date`} alert={summary.overdue > 0} />
                <Stat label="Invoiced this month" value={`RM ${formatMoney(summary.this_month)}`} />
            </div>

            <Card>
                <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoice, customer…" className="pl-8" />
                    </div>
                    <div className="inline-flex flex-wrap rounded-md border p-0.5">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setFilter(f.key)}
                                className={cn(
                                    'rounded px-3 py-1 text-sm transition-colors',
                                    filter === f.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {f.label}
                                <span className="ml-1.5 text-xs opacity-70 tabular-nums">{counts[f.key]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-4">Invoice</TableHead>
                            <TableHead>Bill to</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead className="text-right">Total (RM)</TableHead>
                            <TableHead className="text-right">Balance (RM)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((inv) => {
                            const voided = inv.status === 'voided';
                            return (
                                <TableRow key={inv.id} className={cn(voided && 'text-muted-foreground')}>
                                    <TableCell className="pl-4">
                                        <button type="button" onClick={() => setViewing(inv)} className={cn('font-medium underline-offset-4 hover:underline', voided && 'line-through')}>
                                            {inv.receipt_no}
                                        </button>
                                        <div className="text-xs text-muted-foreground">{formatDate(inv.sale_date)}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{inv.customer_company || inv.customer_name}</div>
                                        {inv.customer_company && <div className="text-xs text-muted-foreground">{inv.customer_name}</div>}
                                    </TableCell>
                                    <TableCell className={cn('whitespace-nowrap', inv.is_overdue && 'font-medium text-destructive')}>
                                        {formatDate(inv.due_date)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{formatMoney(inv.total)}</TableCell>
                                    <TableCell className="text-right font-semibold tabular-nums">{voided ? '—' : formatMoney(inv.balance_due)}</TableCell>
                                    <TableCell><PaymentStatusBadge sale={inv} /></TableCell>
                                    <TableCell className="pr-4">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(inv)} aria-label="View">
                                                <Eye />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                <a href={route('sales.invoice', inv.id)} target="_blank" rel="noopener" aria-label="Invoice PDF">
                                                    <FileText />
                                                </a>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                    {invoices.length === 0 ? 'No invoices yet.' : 'No invoices here.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="border-t px-4 py-3 text-sm text-muted-foreground">{rows.length} of {invoices.length} invoices</div>
            </Card>

            <SaleDetailDialog
                sale={viewing}
                paymentMethods={paymentMethods}
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
