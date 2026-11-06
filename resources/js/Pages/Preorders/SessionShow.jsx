import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    ClipboardList,
    Lock,
    LockOpen,
    MapPin,
    MoreHorizontal,
    Pencil,
    Printer,
    RefreshCw,
    RotateCcw,
    Search,
    ShoppingBag,
    Trash2,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import InventoryPage from '@/Components/inventory/InventoryPage';
import { FormStatusBadge, OrderStatusBadge, PublicLink, pickupText } from '@/Components/preorders/PreorderBits';
import { formatMoney, formatQty, formatUnits } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
    ['pending', 'To collect'],
    ['collected', 'Collected'],
    ['cancelled', 'Cancelled'],
    ['all', 'All'],
];

const openPdf = (url) => window.open(url, '_blank', 'noopener');

export default function SessionShow({ session, orders = [], summary, stats }) {
    const [selected, setSelected] = useState([]);
    const closed = session.status === 'closed';

    const toggleForm = () => router.post(route('preorders.toggle', session.id), {}, { preserveScroll: true });
    const newLink = () => {
        if (window.confirm('Make a new link? The old link will stop working for customers.')) {
            router.post(route('preorders.link', session.id), {}, { preserveScroll: true });
        }
    };
    const remove = () => {
        if (window.confirm(`Delete "${session.name}"?`)) router.delete(route('preorders.destroy', session.id));
    };

    const printSlips = (ids = selected) => openPdf(route('preorders.slips', ids.length ? { session: session.id, ids: ids.join(',') } : session.id));

    return (
        <InventoryPage
            title={session.name}
            description={(
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Pickup {pickupText(session) || '—'}</span>
                    {session.pickup_location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{session.pickup_location}</span>}
                    {session.event && <span>Event: {session.event.name}</span>}
                </span>
            )}
            backHref={route('preorders.index')}
            actions={(
                <>
                    <Button variant="outline" onClick={() => openPdf(route('preorders.summary', session.id))}>
                        <ClipboardList />Packing summary
                    </Button>
                    <Button onClick={() => printSlips([])} disabled={stats.pending === 0}>
                        <Printer />Print slips ({stats.pending})
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" aria-label="More"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={route('preorders.edit', session.id)}><Pencil />Edit session & items</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={toggleForm}>
                                {closed ? <LockOpen /> : <Lock />}
                                {closed ? 'Reopen form' : 'Close form'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={newLink}><RefreshCw />New link</DropdownMenuItem>
                            {orders.length === 0 && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={remove} className="text-destructive focus:text-destructive"><Trash2 />Delete session</DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
        >
            <Card>
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-2 md:w-56 md:shrink-0">
                        <FormStatusBadge session={session} accepting={session.accepting} />
                        <span className="text-sm text-muted-foreground">Order form</span>
                    </div>
                    <PublicLink url={session.public_url} className="flex-1" />
                </CardContent>
                {!session.accepting && session.status === 'open' && (
                    <p className="px-4 pb-4 text-xs text-muted-foreground">
                        The form is not taking orders{session.closes_at ? ' because the closing time has passed' : ''}. Edit the session to change the closing time.
                    </p>
                )}
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Orders" value={stats.orders} hint={stats.cancelled ? `${stats.cancelled} cancelled` : null} />
                <Stat label="To collect" value={stats.pending} hint={`RM ${formatMoney(stats.to_collect)}`} />
                <Stat label="Collected" value={stats.collected} />
                <Stat label="Order value" value={`RM ${formatMoney(stats.value)}`} />
            </div>

            <Tabs defaultValue="orders" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="pack">What to pack</TabsTrigger>
                </TabsList>
                <TabsContent value="orders">
                    <OrdersTab orders={orders} selected={selected} setSelected={setSelected} printSlips={printSlips} />
                </TabsContent>
                <TabsContent value="pack">
                    <PackTab summary={summary} />
                </TabsContent>
            </Tabs>
        </InventoryPage>
    );
}

function Stat({ label, value, hint }) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold tabular-nums">{value}</p>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </CardContent>
        </Card>
    );
}

function OrdersTab({ orders, selected, setSelected, printSlips }) {
    const [status, setStatus] = useState('pending');
    const [query, setQuery] = useState('');

    const counts = useMemo(() => ({
        pending: orders.filter((o) => o.status === 'pending').length,
        collected: orders.filter((o) => o.status === 'collected').length,
        cancelled: orders.filter((o) => o.status === 'cancelled').length,
        all: orders.length,
    }), [orders]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const digits = q.replace(/\D/g, '');
        return orders.filter((o) => {
            if (status !== 'all' && o.status !== status) return false;
            if (!q) return true;
            return o.order_no.toLowerCase().includes(q)
                || o.customer_name.toLowerCase().includes(q)
                || (digits.length >= 3 && o.customer_phone.replace(/\D/g, '').includes(digits));
        });
    }, [orders, status, query]);

    const allChecked = visible.length > 0 && visible.every((o) => selected.includes(o.id));
    const toggleAll = () => setSelected(allChecked ? selected.filter((id) => !visible.some((o) => o.id === id)) : [...new Set([...selected, ...visible.map((o) => o.id)])]);
    const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

    const cancel = (order) => {
        const reason = window.prompt(`Cancel order ${order.order_no} for ${order.customer_name}?\nReason (optional):`, '');
        if (reason === null) return;
        router.post(route('preorders.orders.cancel', order.id), { reason }, { preserveScroll: true });
    };
    const restore = (order) => router.post(route('preorders.orders.restore', order.id), {}, { preserveScroll: true });

    return (
        <Card>
            <CardHeader className="gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-1">
                    {STATUS_FILTERS.map(([key, label]) => (
                        <Button key={key} size="sm" variant={status === key ? 'default' : 'ghost'} onClick={() => setStatus(key)}>
                            {label}
                            <span className={cn('tabular-nums', status === key ? 'opacity-70' : 'text-muted-foreground')}>{counts[key]}</span>
                        </Button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order no, name or phone" className="pl-9" />
                    </div>
                    {selected.length > 0 && (
                        <Button variant="outline" onClick={() => printSlips(selected)}>
                            <Printer />Print {selected.length}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {visible.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-14 text-center text-sm text-muted-foreground">
                        <ShoppingBag className="h-6 w-6" />
                        {orders.length === 0 ? 'No orders yet. Share the link to start taking orders.' : 'No orders match.'}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10 pl-4">
                                    <input type="checkbox" className="rounded border-input" checked={allChecked} onChange={toggleAll} aria-label="Select all" />
                                </TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="hidden md:table-cell">Items</TableHead>
                                <TableHead className="text-right">Total (RM)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((order) => (
                                <TableRow key={order.id} className={cn(order.status === 'cancelled' && 'text-muted-foreground')}>
                                    <TableCell className="pl-4 align-top">
                                        <input type="checkbox" className="rounded border-input" checked={selected.includes(order.id)} onChange={() => toggle(order.id)} aria-label={`Select ${order.order_no}`} />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap align-top">
                                        <div className="font-mono text-sm font-medium">{order.order_no}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('en-MY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="font-medium">{order.customer_name}</div>
                                        <a href={`tel:${order.customer_phone}`} className="text-sm hover:underline">{order.customer_phone}</a>
                                        {order.customer_address && <div className="line-clamp-2 max-w-64 whitespace-pre-line text-xs text-muted-foreground">{order.customer_address}</div>}
                                        <ItemsList order={order} className="mt-1 md:hidden" />
                                    </TableCell>
                                    <TableCell className="hidden align-top md:table-cell">
                                        <ItemsList order={order} />
                                    </TableCell>
                                    <TableCell className="text-right align-top font-medium tabular-nums">{formatMoney(order.total)}</TableCell>
                                    <TableCell className="align-top">
                                        <OrderStatusBadge status={order.status} />
                                        {order.sale && <div className="mt-1 font-mono text-xs text-muted-foreground">{order.sale.receipt_no}</div>}
                                        {order.cancel_reason && <div className="mt-1 max-w-40 text-xs">{order.cancel_reason}</div>}
                                    </TableCell>
                                    <TableCell className="pr-4 align-top">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions"><MoreHorizontal /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => printSlips([order.id])}><Printer />Print slip</DropdownMenuItem>
                                                {order.status === 'pending' && (
                                                    <>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('sales.pos', { collect: order.id })}><ShoppingBag />Collect at POS</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => cancel(order)} className="text-destructive focus:text-destructive"><XCircle />Cancel order</DropdownMenuItem>
                                                    </>
                                                )}
                                                {order.status === 'collected' && order.sale && (
                                                    <DropdownMenuItem onSelect={() => openPdf(route('sales.receipt', order.sale.id))}><Printer />Receipt</DropdownMenuItem>
                                                )}
                                                {order.status === 'cancelled' && (
                                                    <DropdownMenuItem onSelect={() => restore(order)}><RotateCcw />Restore order</DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function ItemsList({ order, className }) {
    return (
        <div className={cn('space-y-0.5 text-sm', className)}>
            {order.lines.map((line) => (
                <div key={line.id}>
                    <span className="font-medium tabular-nums">{line.quantity}×</span> {line.label}
                </div>
            ))}
            {order.notes && <div className="max-w-72 text-xs italic text-muted-foreground">“{order.notes}”</div>}
        </div>
    );
}

function PackTab({ summary }) {
    const items = summary.items;
    const shortages = summary.products.filter((p) => p.short > 0);

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                    <CardDescription>"To pack" counts orders not collected yet. Cancelled orders are left out.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Item</TableHead>
                                <TableHead className="text-right">Orders</TableHead>
                                <TableHead className="text-right">Ordered</TableHead>
                                <TableHead className="text-right">To pack</TableHead>
                                <TableHead className="hidden text-right sm:table-cell">Stock needed</TableHead>
                                <TableHead className="hidden pr-6 text-right md:table-cell">Quota left</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="pl-6">
                                        <div className="font-medium">{item.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.tracked
                                                ? `${item.product_name}${item.unit_quantity > 1 ? ` · ${formatUnits(item.unit_quantity)} each` : ''}`
                                                : 'Custom item · no stock'} · RM {formatMoney(item.price)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{item.orders}</TableCell>
                                    <TableCell className="text-right tabular-nums">{item.units}</TableCell>
                                    <TableCell className="text-right text-lg font-semibold tabular-nums">{item.pending_units}</TableCell>
                                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                                        {item.tracked ? formatUnits(item.stock_needed) : <span className="text-muted-foreground">Not tracked</span>}
                                    </TableCell>
                                    <TableCell className="hidden pr-6 text-right tabular-nums md:table-cell">
                                        {item.quota === null ? '—' : Math.max(0, item.quota - item.units)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Stock check</CardTitle>
                    <CardDescription>Stock needed for orders still to collect, against stock on hand now.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {summary.products.length === 0 && <p className="text-sm text-muted-foreground">No items.</p>}
                    {summary.products.map((p) => (
                        <div key={p.product_id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                            <div className="min-w-0">
                                <p className="truncate font-medium">{p.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    Need {formatUnits(p.needed)} · have {formatUnits(p.on_hand)}
                                </p>
                            </div>
                            {p.short > 0
                                ? <Badge variant="destructive" className="shrink-0">Short {formatUnits(p.short)}</Badge>
                                : <Badge variant="secondary" className="shrink-0">Enough</Badge>}
                        </div>
                    ))}
                    {shortages.length > 0 && (
                        <p className="text-xs text-muted-foreground">Record a Stock In (GRN) before pickup day, or the POS will not let you collect those orders.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
