import { Link } from '@inertiajs/react';
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, ClipboardList, ScrollText } from 'lucide-react';
import { Card, CardContent } from '@/Components/ui/card';
import InventoryPage from '@/Components/inventory/InventoryPage';
import BalanceTable, { isLowStock } from '@/Components/inventory/BalanceTable';
import { formatMoney } from '@/lib/format';

export default function InventoryIndex({ balance = [], counts = {} }) {
    const modules = [
        { title: 'Stock In', description: 'GRN and opening stock', href: route('inventory.stockIn.index'), icon: ArrowDownToLine, count: counts.stock_in },
        { title: 'Stock Out', description: 'Stock out and sales invoices', href: route('inventory.stockOut.index'), icon: ArrowUpFromLine, count: counts.stock_out },
        { title: 'Stock Card', description: 'Movement history per product', href: route('inventory.stockCard'), icon: ScrollText },
        { title: 'Adjustment & Dispose', description: 'Stock count and write-offs', href: route('inventory.adjustment.index'), icon: ClipboardList, count: counts.adjustment },
    ];

    const totalValue = balance.reduce((sum, row) => sum + Number(row.stock_value || 0), 0);
    const lowCount = balance.filter(isLowStock).length;
    const outCount = balance.filter((row) => Number(row.balance) <= 0).length;

    return (
        <InventoryPage title="Inventory" description="Track stock moving in and out, and what you hold right now.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {modules.map(({ title, description, href, icon: Icon, count }) => (
                    <Link key={title} href={href} className="group">
                        <Card className="h-full transition-colors group-hover:border-foreground/30 group-hover:bg-accent/50">
                            <CardContent className="flex h-full items-start gap-4 p-5">
                                <div className="rounded-lg bg-primary p-2.5 text-primary-foreground">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold">{title}</p>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{description}</p>
                                    {count !== undefined && (
                                        <p className="mt-2 text-xs text-muted-foreground">{count} document{count === 1 ? '' : 's'}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Summary label="Products" value={balance.length} />
                <Summary label="Stock value" value={`RM ${formatMoney(totalValue)}`} />
                <Summary label="Low stock" value={lowCount} alert={lowCount > 0} />
                <Summary label="Out of stock" value={outCount} alert={outCount > 0} />
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold tracking-tight">Stock balance</h2>
                <BalanceTable balance={balance} />
            </div>
        </InventoryPage>
    );
}

function Summary({ label, value, alert = false }) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${alert ? 'text-destructive' : ''}`}>{value}</p>
            </CardContent>
        </Card>
    );
}
