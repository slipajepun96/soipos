import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/notifications';
import {
    Banknote,
    Camera,
    CalendarDays,
    Check,
    Clock,
    FileText,
    CheckCircle2,
    CreditCard,
    History,
    PackageCheck,
    Landmark,
    Minus,
    Plus,
    Printer,
    ScanBarcode,
    Search,
    ShoppingCart,
    Smartphone,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import CollectPreorderDialog from '@/Components/preorders/CollectPreorderDialog';
import BarcodeScannerDialog from '@/Components/sales/BarcodeScannerDialog';
import { formatDate, formatMoney, formatQty } from '@/lib/format';
import { cn } from '@/lib/utils';

const CART_KEY = 'soipos.pos.cart';
const EVENT_KEY = 'soipos.pos.event';
const METHOD_ICONS = { Cash: Banknote, Card: CreditCard, 'E-Wallet': Smartphone, 'Bank Transfer': Landmark };

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function loadCart() {
    try {
        const saved = JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
        return Array.isArray(saved) ? saved.filter((l) => !l.option).map((l) => ({ ...l, key: l.product_id })) : [];
    } catch {
        return [];
    }
}

/** Suggested cash notes for quick tender: exact, then rounded up to common notes. */
function cashSuggestions(total) {
    if (total <= 0) return [];
    const values = [total, ...[1, 5, 10, 20, 50, 100].map((n) => Math.ceil(total / n) * n)];
    return [...new Set(values.map(round2))].filter((v) => v >= total).slice(0, 5);
}

export default function Pos({ products = [], categories = [], availableStock = {}, paymentMethods = [], events = [] }) {
    const searchRef = useRef(null);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [cart, setCart] = useState(loadCart);
    const [customer, setCustomer] = useState({ name: '', company: '', phone: '', email: '', address: '' });
    const [docType, setDocType] = useState('receipt'); // receipt | invoice
    const [payLater, setPayLater] = useState(false);
    const [showCustomer, setShowCustomer] = useState(false);
    const [discountValue, setDiscountValue] = useState('');
    const [discountMode, setDiscountMode] = useState('amount'); // amount | percent
    const [method, setMethod] = useState(paymentMethods[0] || 'Cash');
    const [tendered, setTendered] = useState('');
    const [reference, setReference] = useState('');
    const [errors, setErrors] = useState([]);
    const [notice, setNotice] = useState('');
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState(null);
    const [mobileCartOpen, setMobileCartOpen] = useState(false);
    // ?collect=<order id> (from a pre-order session page) opens the collect dialog on that order.
    const [collectOrderId, setCollectOrderId] = useState(() => new URLSearchParams(window.location.search).get('collect'));
    const [collectOpen, setCollectOpen] = useState(() => !!new URLSearchParams(window.location.search).get('collect'));
    const [eventId, setEventId] = useState(() => {
        try { return window.localStorage.getItem(EVENT_KEY) || ''; } catch { return ''; }
    });
    const activeEvent = events.find((e) => e.id === eventId) || null;

    // Forget a remembered event once it is closed or deleted.
    useEffect(() => {
        if (eventId && !activeEvent) setEventId('');
    }, [eventId, activeEvent]);

    useEffect(() => {
        try {
            if (eventId) window.localStorage.setItem(EVENT_KEY, eventId);
            else window.localStorage.removeItem(EVENT_KEY);
        } catch { /* storage unavailable */ }
    }, [eventId]);

    useEffect(() => {
        try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* storage unavailable */ }
    }, [cart]);

    useEffect(() => {
        if (!notice) return undefined;
        const t = setTimeout(() => setNotice(''), 2500);
        return () => clearTimeout(t);
    }, [notice]);

    const stockOf = useCallback((id) => Number(availableStock[id] || 0), [availableStock]);

    const usedCategories = useMemo(() => {
        const ids = new Set(products.map((p) => p.product_category_id));
        return categories.filter((c) => ids.has(c.id));
    }, [products, categories]);

    const visibleProducts = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products.filter((p) => {
            if (category !== 'all' && p.product_category_id !== category) return false;
            if (!q) return true;
            return [p.product_name, p.product_sku_code, p.product_code]
                .some((v) => v && String(v).toLowerCase().includes(q));
        });
    }, [products, query, category]);

    /* ---------- cart ---------- */

    /** Returns an error message, or null when the product was added. */
    const addToCart = (product, qty = 1) => {
        const key = product.id;
        const available = stockOf(product.id);
        const inCart = cart.filter((l) => l.product_id === product.id).reduce((s, l) => s + Number(l.quantity || 0), 0);
        if (inCart + qty > available) {
            const message = available <= 0
                ? `${product.product_name} is out of stock.`
                : `Only ${formatQty(available)} ${product.product_unit} of ${product.product_name} in stock.`;
            setNotice(message);
            return message;
        }
        setErrors([]);
        setCart((current) => {
            const existing = current.find((l) => l.key === key);
            if (existing) {
                return current.map((l) => (l.key === key ? { ...l, quantity: round2(l.quantity + qty) } : l));
            }
            return [...current, {
                key,
                product_id: product.id,
                name: product.product_name,
                unit: product.product_unit,
                unit_price: Number(product.product_price || 0),
                quantity: qty,
            }];
        });
        return null;
    };

    /* ---------- camera scan ---------- */

    const [scannerOpen, setScannerOpen] = useState(false);
    const findByCode = (code) => {
        const q = String(code).trim().toLowerCase();
        return products.find((p) => [p.product_sku_code, p.product_code].some((v) => v && String(v).trim().toLowerCase() === q));
    };
    const onScanned = (code) => {
        const product = findByCode(code);
        if (!product) return { ok: false, message: `No product with barcode ${code}.` };
        const error = addToCart(product);
        if (error) return { ok: false, message: error };
        const inCart = cart.filter((l) => l.product_id === product.id).reduce((s, l) => s + Number(l.quantity || 0), 0) + 1;
        return { ok: true, message: `${product.product_name} added (${formatQty(inCart)} in cart)` };
    };

    const setQuantity = (key, quantity) => {
        const line = cart.find((l) => l.key === key);
        if (!line) return;
        let q = Math.max(0, Number(quantity) || 0);
        const available = stockOf(line.product_id);
        if (q > available) {
            setNotice(`Only ${formatQty(available)} in stock.`);
            q = available;
        }
        setCart((current) => current.map((l) => (l.key === key ? { ...l, quantity: q } : l)));
    };

    const setPrice = (key, price) => {
        setCart((current) => current.map((l) => (l.key === key ? { ...l, unit_price: price } : l)));
    };

    const removeLine = (key) => setCart((current) => current.filter((l) => l.key !== key));

    const resetSale = () => {
        setCart([]);
        setCustomer({ name: '', company: '', phone: '', email: '', address: '' });
        setDocType('receipt');
        setPayLater(false);
        setShowCustomer(false);
        setDiscountValue('');
        setDiscountMode('amount');
        setMethod(paymentMethods[0] || 'Cash');
        setTendered('');
        setReference('');
        setErrors([]);
        setCompleted(null);
        setTimeout(() => searchRef.current?.focus(), 50);
    };

    /* ---------- totals ---------- */

    const subtotal = round2(cart.reduce((sum, l) => sum + round2(Number(l.quantity || 0) * Number(l.unit_price || 0)), 0));
    const rawDiscount = Number(discountValue || 0);
    const discount = Math.min(subtotal, round2(discountMode === 'percent' ? (subtotal * Math.min(rawDiscount, 100)) / 100 : rawDiscount));
    const total = round2(subtotal - discount);
    const isInvoice = docType === 'invoice';
    const isCash = !payLater && method === 'Cash';
    const paid = payLater ? 0 : isCash ? Number(tendered || 0) : total;
    const change = round2(paid - total);
    const itemCount = cart.reduce((sum, l) => sum + Number(l.quantity || 0), 0);
    const validLines = cart.filter((l) => Number(l.quantity) > 0);
    const canCharge = validLines.length > 0 && !processing
        && (payLater || !isCash || paid >= total) && (!isInvoice || customer.name.trim() !== '');

    /* ---------- checkout ---------- */

    const charge = async () => {
        if (!canCharge) return;
        setProcessing(true);
        setErrors([]);
        try {
            const { data } = await axios.post(route('sales.checkout'), {
                document_type: docType,
                sales_event_id: activeEvent?.id || null,
                customer_name: customer.name || null,
                customer_phone: customer.phone || null,
                customer_company: isInvoice ? customer.company || null : null,
                customer_email: isInvoice ? customer.email || null : null,
                customer_address: isInvoice ? customer.address || null : null,
                pay_later: payLater,
                items: validLines.map((l) => ({ product_id: l.product_id, quantity: l.quantity, unit_price: Number(l.unit_price || 0) })),
                discount,
                payment_method: payLater ? null : method,
                payment_reference: reference || null,
                amount_tendered: isCash ? paid : null,
            });
            setCompleted(data.sale);
            toast.success(`${data.sale.document_type === 'invoice' ? 'Invoice' : 'Sale'} ${data.sale.receipt_no} saved.`);
            setMobileCartOpen(false);
            router.reload({ only: ['availableStock'] });
        } catch (error) {
            const bag = error.response?.data?.errors;
            setErrors(bag ? [...new Set(Object.values(bag).flat())] : [errorMessage(error)]);
            toast.error('Sale not saved', { description: errorMessage(error) });
        } finally {
            setProcessing(false);
        }
    };

    /* ---------- search / scan ---------- */

    const onSearchKeyDown = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const q = query.trim().toLowerCase();
        if (!q) return;
        const exact = products.find((p) => [p.product_sku_code, p.product_code].some((v) => v && String(v).toLowerCase() === q));
        const target = exact || (visibleProducts.length === 1 ? visibleProducts[0] : null);
        if (target) {
            addToCart(target);
            setQuery('');
        } else {
            setNotice(`No single product matches "${query}".`);
        }
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
            if (e.key === 'F9' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); charge(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const cartPanel = (
        <CartPanel
            cart={cart}
            stockOf={stockOf}
            setQuantity={setQuantity}
            setPrice={setPrice}
            removeLine={removeLine}
            clear={() => setCart([])}
            customer={customer}
            activeEvent={activeEvent}
            docType={docType}
            setDocType={(t) => { setDocType(t); if (t === 'receipt') setPayLater(false); }}
            payLater={payLater}
            setPayLater={setPayLater}
            setCustomer={setCustomer}
            showCustomer={showCustomer}
            setShowCustomer={setShowCustomer}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            discountMode={discountMode}
            setDiscountMode={setDiscountMode}
            subtotal={subtotal}
            discount={discount}
            total={total}
            itemCount={itemCount}
            paymentMethods={paymentMethods}
            method={method}
            setMethod={setMethod}
            tendered={tendered}
            setTendered={setTendered}
            reference={reference}
            setReference={setReference}
            change={change}
            isCash={isCash}
            paid={paid}
            errors={errors}
            processing={processing}
            canCharge={canCharge}
            charge={charge}
        />
    );

    return (
        <AuthenticatedLayout>
            <Head title="POS" />

            <div className="mx-auto grid max-w-[1600px] lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_420px]">
                {/* Products */}
                <section className="flex min-h-0 flex-col gap-4 p-4 pb-24 lg:pb-4">
                    <div className="flex flex-wrap gap-2">
                        <div className="relative min-w-48 flex-1">
                            <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onSearchKeyDown}
                                placeholder="Search or scan barcode / SKU and press Enter"
                                className="h-11 bg-background pl-9 pr-16 text-base"
                            />
                            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 text-[10px] text-muted-foreground sm:block">F2</kbd>
                        </div>
                        <Button variant="outline" className="h-11" onClick={() => setScannerOpen(true)} aria-label="Scan with camera">
                            <Camera />
                            <span className="hidden sm:inline">Camera</span>
                        </Button>
                        <SessionPicker events={events} value={activeEvent?.id || ''} onChange={setEventId} />
                        <Button variant="outline" className="h-11" onClick={() => { setCollectOrderId(null); setCollectOpen(true); }}>
                            <PackageCheck />
                            <span className="hidden sm:inline">Collect pre-order</span>
                        </Button>
                        <Button variant="outline" className="h-11" asChild>
                            <Link href={route('sales.index')}>
                                <History />
                                <span className="hidden sm:inline">Sales</span>
                            </Link>
                        </Button>
                    </div>

                    {usedCategories.length > 0 && (
                        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                            {[{ id: 'all', product_categories_name: 'All' }, ...usedCategories].map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCategory(c.id)}
                                    className={cn(
                                        'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                                        category === c.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
                                    )}
                                >
                                    {c.product_categories_name}
                                </button>
                            ))}
                        </div>
                    )}

                    {notice && (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription>{notice}</AlertDescription>
                        </Alert>
                    )}

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {visibleProducts.length === 0 ? (
                            <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Search className="h-6 w-6" />
                                No products match.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                {visibleProducts.map((product) => (
                                    <ProductTile
                                        key={product.id}
                                        product={product}
                                        stock={stockOf(product.id)}
                                        inCart={cart.filter((l) => l.product_id === product.id).reduce((s, l) => s + Number(l.quantity || 0), 0)}
                                        onAdd={() => addToCart(product)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Cart (desktop) */}
                <aside className="hidden min-h-0 border-l bg-background lg:flex lg:flex-col">{cartPanel}</aside>
            </div>

            {/* Cart (mobile) */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background p-3 lg:hidden">
                <Button className="h-12 w-full justify-between text-base" onClick={() => setMobileCartOpen(true)}>
                    <span className="flex items-center gap-2">
                        <ShoppingCart />
                        {formatQty(itemCount)} item{itemCount === 1 ? '' : 's'}
                    </span>
                    <span>RM {formatMoney(total)}</span>
                </Button>
            </div>
            <Dialog open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
                <DialogContent className="flex h-[100dvh] max-w-full flex-col gap-0 rounded-none p-0 sm:h-[90vh] sm:max-w-lg sm:rounded-lg">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Cart</DialogTitle>
                        <DialogDescription>Current sale</DialogDescription>
                    </DialogHeader>
                    {cartPanel}
                </DialogContent>
            </Dialog>

            <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onDetected={onScanned} />

            <CollectPreorderDialog
                open={collectOpen}
                onOpenChange={(o) => {
                    setCollectOpen(o);
                    if (!o && collectOrderId) {
                        setCollectOrderId(null);
                        window.history.replaceState(window.history.state, '', route('sales.pos'));
                    }
                }}
                paymentMethods={paymentMethods}
                initialOrderId={collectOrderId}
                onCollected={(sale) => {
                    setCollectOpen(false);
                    setCollectOrderId(null);
                    window.history.replaceState(window.history.state, '', route('sales.pos'));
                    setCompleted({ ...sale, fromPreorder: true });
                    toast.success(`Pre-order collected. Receipt ${sale.receipt_no} saved.`);
                    router.reload({ only: ['availableStock'] });
                }}
            />

            {/* After a pre-order collection keep whatever is in the cart. */}
            <CompletedDialog sale={completed} onNewSale={completed?.fromPreorder ? () => setCompleted(null) : resetSale} />
        </AuthenticatedLayout>
    );
}

/** Choose whether sales go to normal trading or to an open event. */
function SessionPicker({ events, value, onChange }) {
    const [open, setOpen] = useState(false);
    const current = events.find((e) => e.id === value);
    const options = [{ id: '', name: 'Normal sales', hint: 'Not part of an event' }, ...events.map((e) => ({
        id: e.id,
        name: e.name,
        hint: [e.location, e.start_date === e.end_date ? formatDate(e.start_date) : `${formatDate(e.start_date)} – ${formatDate(e.end_date)}`].filter(Boolean).join(' · '),
    }))];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={current ? 'default' : 'outline'}
                    className="h-11 max-w-[14rem] justify-start"
                    title="Sales session"
                >
                    <CalendarDays />
                    <span className="hidden truncate sm:inline">{current ? current.name : 'Normal sales'}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-1">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Sales session</p>
                {options.map((o) => (
                    <button
                        key={o.id || 'none'}
                        type="button"
                        onClick={() => { onChange(o.id); setOpen(false); }}
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                    >
                        <Check className={cn('mt-0.5 h-4 w-4 shrink-0', o.id === value ? 'opacity-100' : 'opacity-0')} />
                        <span className="min-w-0">
                            <span className="block truncate font-medium">{o.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>
                        </span>
                    </button>
                ))}
                <div className="mt-1 border-t px-2 py-2">
                    <Link href={route('sales.events.index')} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                        Manage events
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function ProductTile({ product, stock, inCart, onAdd }) {
    const out = stock <= 0;
    const initials = product.product_name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

    return (
        <button
            type="button"
            onClick={onAdd}
            disabled={out}
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all',
                'hover:border-foreground/40 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm',
            )}
        >
            <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                {product.product_img_address ? (
                    <img src={product.product_img_address} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                    <span className="text-2xl font-semibold text-muted-foreground">{initials}</span>
                )}
            </div>
            {inCart > 0 && (
                <Badge className="absolute right-2 top-2 tabular-nums">{formatQty(inCart)}</Badge>
            )}
            <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{product.product_name}</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                    <p className="font-semibold tabular-nums">RM {formatMoney(product.product_price)}</p>
                    <p className={cn('text-xs tabular-nums', out ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                        {out ? 'Out of stock' : `${formatQty(stock)} left`}
                    </p>
                </div>
            </div>
        </button>
    );
}

function CartPanel(props) {
    const {
        cart, stockOf, setQuantity, setPrice, removeLine, clear,
        customer, setCustomer, activeEvent, showCustomer, setShowCustomer, docType, setDocType, payLater, setPayLater,
        discountValue, setDiscountValue, discountMode, setDiscountMode,
        subtotal, discount, total, itemCount,
        paymentMethods, method, setMethod, tendered, setTendered, reference, setReference,
        change, isCash, paid, errors, processing, canCharge, charge,
    } = props;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="min-w-0">
                    <h2 className="flex items-center gap-2 font-semibold">
                        Current sale
                        {activeEvent && (
                            <Badge variant="outline" className="max-w-40 truncate font-normal" title={activeEvent.name}>
                                <CalendarDays className="mr-1 h-3 w-3 shrink-0" />
                                <span className="truncate">{activeEvent.name}</span>
                            </Badge>
                        )}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        {cart.length} product{cart.length === 1 ? '' : 's'} · {formatQty(itemCount)} item{itemCount === 1 ? '' : 's'}
                    </p>
                </div>
                <div className="flex gap-1">
                    <Button
                        variant={showCustomer || customer.name || docType === 'invoice' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setShowCustomer(!showCustomer)}
                        aria-label="Customer"
                    >
                        <UserRound />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={clear} disabled={cart.length === 0} aria-label="Clear cart">
                        <Trash2 />
                    </Button>
                </div>
            </div>

            {(showCustomer || docType === 'invoice') && (
                <div className="space-y-2 border-b bg-muted/40 px-4 py-3">
                    <div className="grid grid-cols-2 rounded-md border bg-background p-0.5 text-xs">
                        {[['receipt', 'Receipt'], ['invoice', 'Issue invoice']].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setDocType(key)}
                                className={cn('rounded py-1 font-medium', docType === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            value={customer.name}
                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            placeholder={docType === 'invoice' ? 'Customer name *' : 'Customer name'}
                            className="bg-background"
                        />
                        <Input
                            value={customer.phone}
                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                            placeholder="Phone"
                            className="bg-background"
                        />
                        {docType === 'invoice' && (
                            <>
                                <Input
                                    value={customer.company}
                                    onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
                                    placeholder="Company"
                                    className="bg-background"
                                />
                                <Input
                                    type="email"
                                    value={customer.email}
                                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                                    placeholder="Email"
                                    className="bg-background"
                                />
                                <textarea
                                    rows={2}
                                    value={customer.address}
                                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                                    placeholder="Billing address"
                                    className="col-span-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-input focus:ring-1 focus:ring-ring"
                                />
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
                        <ShoppingCart className="h-8 w-8" />
                        Tap a product or scan a barcode to start a sale.
                    </div>
                ) : (
                    <ul className="divide-y">
                        {cart.map((line) => (
                            <li key={line.key} className="space-y-2 px-4 py-3">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium leading-snug">{line.name}</p>
                                    <button
                                        type="button"
                                        onClick={() => removeLine(line.key)}
                                        className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                                        aria-label={`Remove ${line.name}`}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center rounded-md border">
                                        <button
                                            type="button"
                                            className="flex h-8 w-8 items-center justify-center hover:bg-accent"
                                            onClick={() => (line.quantity <= 1 ? removeLine(line.key) : setQuantity(line.key, line.quantity - 1))}
                                            aria-label="Decrease"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={line.quantity}
                                            onChange={(e) => setQuantity(line.key, e.target.value)}
                                            className="h-8 w-12 border-0 bg-transparent p-0 text-center text-sm tabular-nums focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                            aria-label="Quantity"
                                        />
                                        <button
                                            type="button"
                                            className="flex h-8 w-8 items-center justify-center hover:bg-accent disabled:opacity-40"
                                            onClick={() => setQuantity(line.key, line.quantity + 1)}
                                            disabled={line.quantity + 1 > stockOf(line.product_id)}
                                            aria-label="Increase"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <span className="text-xs text-muted-foreground">×</span>
                                    <div className="relative w-24">
                                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">RM</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={line.unit_price}
                                            onChange={(e) => setPrice(line.key, e.target.value)}
                                            className="h-8 pl-8 pr-1 text-right text-sm tabular-nums"
                                            aria-label="Unit price"
                                        />
                                    </div>
                                    <span className="ml-auto text-sm font-semibold tabular-nums">
                                        {formatMoney(Number(line.quantity || 0) * Number(line.unit_price || 0))}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="space-y-4 border-t bg-muted/30 p-4">
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="tabular-nums">{formatMoney(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Discount</span>
                        <div className="flex items-center gap-1.5">
                            <div className="inline-flex rounded-md border bg-background p-0.5 text-xs">
                                {[['amount', 'RM'], ['percent', '%']].map(([mode, label]) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setDiscountMode(mode)}
                                        className={cn('rounded px-2 py-0.5', discountMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                placeholder="0"
                                className="h-7 w-20 bg-background text-right text-sm tabular-nums"
                                aria-label="Discount"
                            />
                        </div>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-end text-xs text-muted-foreground tabular-nums">−{formatMoney(discount)}</div>
                    )}
                    <div className="flex items-baseline justify-between pt-1">
                        <span className="font-semibold">Total</span>
                        <span className="text-2xl font-bold tabular-nums">RM {formatMoney(total)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                    {paymentMethods.map((m) => {
                        const Icon = METHOD_ICONS[m] || Banknote;
                        return (
                            <button
                                key={m}
                                type="button"
                                onClick={() => { setMethod(m); setPayLater(false); }}
                                className={cn(
                                    'flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-xs font-medium transition-colors',
                                    method === m && !payLater ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {m}
                            </button>
                        );
                    })}
                </div>

                {docType === 'invoice' && (
                    <button
                        type="button"
                        onClick={() => setPayLater(!payLater)}
                        className={cn(
                            '-mt-2 flex w-full items-center justify-center gap-2 rounded-md border py-2 text-xs font-medium transition-colors',
                            payLater ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
                        )}
                    >
                        <Clock className="h-4 w-4" />
                        Pay later — customer pays by the due date
                    </button>
                )}

                {payLater ? (
                    <p className="text-xs text-muted-foreground">
                        The invoice is issued unpaid, due in 30 days. Record payments from Sales → Invoices.
                    </p>
                ) : isCash ? (
                    <div className="space-y-2">
                        <Label htmlFor="tendered" className="text-xs text-muted-foreground">Cash received</Label>
                        <div className="flex gap-2">
                            <Input
                                id="tendered"
                                type="number"
                                min="0"
                                step="0.01"
                                value={tendered}
                                onChange={(e) => setTendered(e.target.value)}
                                placeholder="0.00"
                                className="h-10 bg-background text-right text-base tabular-nums"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {cashSuggestions(total).map((v, i) => (
                                <Button key={v} type="button" variant="outline" size="sm" className="h-7 bg-background px-2 tabular-nums" onClick={() => setTendered(String(v))}>
                                    {i === 0 ? 'Exact' : `RM ${formatMoney(v)}`}
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-baseline justify-between text-sm">
                            <span className="text-muted-foreground">Change</span>
                            <span className={cn('text-lg font-semibold tabular-nums', tendered !== '' && paid < total && 'text-destructive')}>
                                {tendered === '' ? '—' : paid < total ? `Short ${formatMoney(total - paid)}` : `RM ${formatMoney(change)}`}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="reference" className="text-xs text-muted-foreground">Reference (optional)</Label>
                        <Input
                            id="reference"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Approval code / transaction ID"
                            className="bg-background"
                        />
                    </div>
                )}

                {errors.length > 0 && (
                    <Alert variant="destructive" className="py-2">
                        <AlertDescription>
                            {errors.map((e) => <div key={e}>{e}</div>)}
                        </AlertDescription>
                    </Alert>
                )}

                <Button className="h-12 w-full text-base" onClick={charge} disabled={!canCharge}>
                    {processing ? 'Processing…'
                        : payLater ? `Issue invoice RM ${formatMoney(total)}` : `Charge RM ${formatMoney(total)}`}
                    <kbd className="ml-1 hidden rounded border border-primary-foreground/30 px-1 text-[10px] font-normal opacity-70 sm:inline">F9</kbd>
                </Button>
            </div>
        </div>
    );
}

function CompletedDialog({ sale, onNewSale }) {
    const newSaleRef = useRef(null);
    if (!sale) return null;

    const isInvoice = sale.document_type === 'invoice';
    const open = (name) => window.open(route(name, sale.id), '_blank', 'noopener');
    const unpaid = sale.balance_due > 0;

    return (
        <Dialog open onOpenChange={(o) => { if (!o) onNewSale(); }}>
            <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => { e.preventDefault(); newSaleRef.current?.focus(); }}>
                <DialogHeader className="items-center text-center">
                    {unpaid ? <FileText className="h-12 w-12" /> : <CheckCircle2 className="h-12 w-12" />}
                    <DialogTitle className="text-xl">{unpaid ? 'Invoice issued' : 'Payment complete'}</DialogTitle>
                    <DialogDescription>
                        {`${isInvoice ? 'Invoice' : 'Receipt'} ${sale.receipt_no}`}
                    </DialogDescription>
                </DialogHeader>
                <dl className="space-y-2 rounded-lg border p-4 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total</dt>
                        <dd className="font-medium tabular-nums">RM {formatMoney(sale.total)}</dd>
                    </div>
                    {sale.payment_method && (
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">{sale.payment_method}</dt>
                            <dd className="tabular-nums">RM {formatMoney(sale.amount_tendered ?? sale.amount_paid)}</dd>
                        </div>
                    )}
                    {sale.change_due > 0 && (
                        <div className="flex items-baseline justify-between border-t pt-2">
                            <dt className="font-medium">Change</dt>
                            <dd className="text-2xl font-bold tabular-nums">RM {formatMoney(sale.change_due)}</dd>
                        </div>
                    )}
                    {unpaid && (
                        <div className="flex items-baseline justify-between border-t pt-2">
                            <dt className="font-medium">Balance due</dt>
                            <dd className="text-right">
                                <div className="text-2xl font-bold tabular-nums">RM {formatMoney(sale.balance_due)}</div>
                                {sale.due_date && <div className="text-xs text-muted-foreground">by {formatDate(sale.due_date)}</div>}
                            </dd>
                        </div>
                    )}
                </dl>
                <div className={cn('grid gap-2', isInvoice ? 'grid-cols-3' : 'grid-cols-2')}>
                    <Button variant="outline" onClick={() => open('sales.receipt')}>
                        <Printer />
                        Receipt
                    </Button>
                    {isInvoice && (
                        <Button variant="outline" onClick={() => open('sales.invoice')}>
                            <FileText />
                            Invoice
                        </Button>
                    )}
                    <Button ref={newSaleRef} onClick={onNewSale}>New sale</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
