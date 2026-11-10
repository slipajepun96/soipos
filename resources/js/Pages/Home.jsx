import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight, Boxes, CalendarDays, ClipboardList, FileText, Receipt, Settings, ShoppingCart,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function sections(s) {
    return [
        {
            title: 'POS', route: 'sales.pos', icon: ShoppingCart, primary: true,
            description: 'Sell, scan barcodes and take payment.',
            stat: `Today: RM ${formatMoney(s.today_total)} · ${plural(s.today_count, 'sale')}`,
        },
        {
            title: 'Sales', route: 'sales.index', icon: Receipt,
            description: 'Receipts and invoices, reprint or void.',
            stat: `${plural(s.sales_count, 'sale')} recorded`,
        },
        {
            title: 'Pre-orders', route: 'preorders.index', icon: ClipboardList,
            description: 'Order forms, packing slips and pickups.',
            stat: `${s.pending_preorders} to collect · ${plural(s.open_preorder_forms, 'open form')}`,
            alert: s.pending_preorders > 0,
        },
        {
            title: 'Invoices', route: 'sales.invoices.index', icon: FileText,
            description: 'Credit sales and payments received.',
            stat: s.unpaid_invoices ? `${s.unpaid_invoices} unpaid · RM ${formatMoney(s.unpaid_total)}` : 'All paid',
            alert: s.unpaid_invoices > 0,
        },
        {
            title: 'Events', route: 'sales.events.index', icon: CalendarDays,
            description: 'Booths and bazaars with their own report.',
            stat: s.open_events ? `${plural(s.open_events, 'event')} open` : 'No open events',
        },
        {
            title: 'Inventory', route: 'inventory.index', icon: Boxes,
            description: 'Stock, products and suppliers.',
            stat: `${plural(s.products, 'product')} · ${plural(s.suppliers, 'supplier')}${s.low_stock ? ` · ${s.low_stock} low on stock` : ''}`,
            alert: s.low_stock > 0,
        },
        {
            title: 'Settings', route: 'settings.edit', icon: Settings,
            description: 'Store details printed on receipts.',
        },
    ];
}

export default function Home({ stats }) {
    const { auth: { user }, store } = usePage().props;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <AuthenticatedLayout>
            <Head title="Home" />
            <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight">{greeting}, {user.name.split(' ')[0]}</h1>
                    {store && <p className="text-sm text-muted-foreground">{store.name}</p>}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sections(stats).map((item) => <SectionCard key={item.route} item={item} />)}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SectionCard({ item }) {
    const Icon = item.icon;

    return (
        <Link
            href={route(item.route)}
            className={cn(
                'group flex min-w-0 flex-col gap-3 rounded-xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
                item.primary
                    ? 'border-primary bg-primary text-primary-foreground sm:col-span-2 lg:col-span-1'
                    : 'bg-card text-card-foreground hover:border-foreground/30',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <span className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                    item.primary ? 'bg-primary-foreground/15' : 'bg-muted',
                )}
                >
                    <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className={cn(
                    'h-4 w-4 transition-transform group-hover:translate-x-0.5',
                    item.primary ? 'text-primary-foreground/70' : 'text-muted-foreground',
                )}
                />
            </div>
            <div className="min-w-0">
                <p className="text-lg font-semibold">{item.title}</p>
                <p className={cn('text-sm', item.primary ? 'text-primary-foreground/75' : 'text-muted-foreground')}>{item.description}</p>
            </div>
            {item.stat && (
                <p className={cn(
                    'mt-auto flex items-center gap-2 border-t pt-3 text-sm font-medium tabular-nums',
                    item.primary ? 'border-primary-foreground/20' : '',
                )}
                >
                    {item.alert && <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-hidden="true" />}
                    <span className="truncate">{item.stat}</span>
                </p>
            )}
        </Link>
    );
}
