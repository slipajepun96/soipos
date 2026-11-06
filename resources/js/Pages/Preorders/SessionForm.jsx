import { useForm } from '@inertiajs/react';
import { PackageOpen, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import InventoryPage from '@/Components/inventory/InventoryPage';
import DatePicker from '@/Components/inventory/DatePicker';
import DateTimePicker from '@/Components/inventory/DateTimePicker';
import TimePicker, { formatTime, parseTime } from '@/Components/inventory/TimePicker';
import FormField from '@/Components/inventory/FormField';
import ProductCombobox from '@/Components/inventory/ProductCombobox';
import { today, productLabel } from '@/lib/format';

const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:border-input focus:ring-1 focus:ring-ring';
let nextKey = 0;
// Stored as text like "10:00 AM – 4:00 PM"; edited as two time selects.
const splitPickupTime = (text) => {
    const [from = '', to = ''] = String(text || '').split(/\s*[–-]\s*/);
    return { pickup_from: parseTime(from) || '', pickup_to: parseTime(to) || '' };
};
const joinPickupTime = (from, to) => {
    if (from && to) return `${formatTime(from)} – ${formatTime(to)}`;
    if (from) return `From ${formatTime(from)}`;
    if (to) return `Until ${formatTime(to)}`;
    return null;
};

const blankItem = (custom = false) => ({ key: `new-${nextKey++}`, id: null, custom, product_id: '', label: '', unit_quantity: '1', price: '', max_per_order: '', quota: '' });

export default function SessionForm({ session = null, orderedUnits = {}, products = [], events = [] }) {
    const editing = !!session;
    const form = useForm({
        name: session?.name ?? '',
        sales_event_id: session?.sales_event_id ?? '',
        pickup_location: session?.pickup_location ?? '',
        pickup_date: session?.pickup_date ?? today(),
        ...splitPickupTime(session?.pickup_time),
        remarks: session?.remarks ?? '',
        closes_at: session?.closes_at ?? '',
        items: session?.items?.length
            ? session.items.map((i) => ({
                key: i.id,
                id: i.id,
                custom: !i.product_id,
                product_id: i.product_id ?? '',
                label: i.label,
                unit_quantity: String(i.unit_quantity),
                price: String(i.price),
                max_per_order: i.max_per_order ?? '',
                quota: i.quota ?? '',
            }))
            : [blankItem()],
    });
    const { data, setData, errors } = form;

    const productById = (id) => products.find((p) => p.id === id);

    const updateItem = (key, patch) => setData('items', data.items.map((i) => (i.key === key ? { ...i, ...patch } : i)));

    // ProductCombobox hands back the whole product.
    const pickProduct = (key, product) => {
        const item = data.items.find((i) => i.key === key);
        updateItem(key, {
            product_id: product.id,
            label: item.label || productLabel(product) || '',
            price: item.price || (product?.product_price ? String(product.product_price) : ''),
        });
    };

    const submit = (e) => {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            sales_event_id: d.sales_event_id || null,
            closes_at: d.closes_at || null,
            pickup_time: joinPickupTime(d.pickup_from, d.pickup_to),
            pickup_from: undefined,
            pickup_to: undefined,
            items: d.items.map(({ key, custom, ...i }) => ({
                ...i,
                product_id: custom ? null : i.product_id || null,
                unit_quantity: custom ? 1 : i.unit_quantity,
                max_per_order: i.max_per_order === '' ? null : i.max_per_order,
                quota: i.quota === '' ? null : i.quota,
            })),
        }));
        if (editing) form.put(route('preorders.update', session.id), { preserveScroll: true });
        else form.post(route('preorders.store'), { preserveScroll: true });
    };

    const itemError = (index, field) => errors[`items.${index}.${field}`];

    return (
        <InventoryPage
            title={editing ? `Edit ${session.name}` : 'New pre-order session'}
            description="Set what customers can order, where and when they pick up. A public order form is created for you."
            backHref={editing ? route('preorders.show', session.id) : route('preorders.index')}
        >
            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Session & pickup</CardTitle>
                        <CardDescription>Customers see all of this on the order form.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <FormField label="Session name" htmlFor="name" required error={errors.name} className="md:col-span-2">
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Cameron strawberry pre-order — December" />
                        </FormField>
                        <FormField label="Pickup / sales location" htmlFor="pickup_location" required error={errors.pickup_location} className="md:col-span-2">
                            <Input id="pickup_location" value={data.pickup_location} onChange={(e) => setData('pickup_location', e.target.value)} placeholder="e.g. Booth 12, Bazar Ramadan Seksyen 7" />
                        </FormField>
                        <FormField label="Pickup date" htmlFor="pickup_date" required error={errors.pickup_date}>
                            <DatePicker id="pickup_date" value={data.pickup_date} onChange={(v) => setData('pickup_date', v || '')} />
                        </FormField>
                        <FormField label="Pickup time" htmlFor="pickup_from" error={errors.pickup_time} hint="Optional">
                            <div className="flex items-center gap-2">
                                <TimePicker id="pickup_from" value={data.pickup_from} onChange={(v) => setData('pickup_from', v)} placeholder="From" />
                                <span className="text-sm text-muted-foreground">to</span>
                                <TimePicker value={data.pickup_to} onChange={(v) => setData('pickup_to', v)} placeholder="To" />
                                {(data.pickup_from || data.pickup_to) && (
                                    <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setData((d) => ({ ...d, pickup_from: '', pickup_to: '' }))} aria-label="Clear pickup time">
                                        <X />
                                    </Button>
                                )}
                            </div>
                        </FormField>
                        <FormField label="Stop taking orders at" htmlFor="closes_at" error={errors.closes_at} hint="Optional. The form closes by itself at this time.">
                            <DateTimePicker id="closes_at" value={data.closes_at} onChange={(v) => setData('closes_at', v)} />
                        </FormField>
                        {events.length > 0 && (
                            <FormField label="Event" htmlFor="sales_event_id" error={errors.sales_event_id} hint="Optional. Collected orders count in this event's report.">
                                <select id="sales_event_id" className={selectClass} value={data.sales_event_id} onChange={(e) => setData('sales_event_id', e.target.value)}>
                                    <option value="">Not part of an event</option>
                                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                                </select>
                            </FormField>
                        )}
                        <FormField label="Remarks for customers" htmlFor="remarks" error={errors.remarks} className="md:col-span-2" hint="e.g. payment on pickup, bring your own bag, contact number for questions">
                            <Textarea id="remarks" rows={3} value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} />
                        </FormField>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Items customers can order</CardTitle>
                        <CardDescription>
                            Each item is a fixed pack counted in stock units, e.g. "Twin pack" with 2 stock units each uses 2 units of the product per order. Stock is deducted when the order is collected.
                            Use a custom item for things not in your product list: the sale is recorded but no stock out.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {errors.items && (
                            <Alert variant="destructive"><AlertDescription>{errors.items}</AlertDescription></Alert>
                        )}

                        {data.items.map((item, index) => {
                            const product = productById(item.product_id);
                            const ordered = item.id ? Number(orderedUnits[item.id] || 0) : 0;
                            return (
                                <div key={item.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-6 lg:grid-cols-12 lg:items-start">
                                    <div className="space-y-2 sm:col-span-3 lg:col-span-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <Label htmlFor={`product-${item.key}`}>{item.custom ? 'Custom item' : 'Product'}</Label>
                                            {ordered === 0 && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                                    onClick={() => updateItem(item.key, { custom: !item.custom, product_id: '' })}
                                                >
                                                    {item.custom ? 'Pick from product list' : 'Not in product list?'}
                                                </button>
                                            )}
                                        </div>
                                        {item.custom ? (
                                            <div className="flex h-9 items-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground">
                                                <PackageOpen className="h-4 w-4 shrink-0" />
                                                <span className="truncate">Sales recorded, no stock out</span>
                                            </div>
                                        ) : (
                                            <ProductCombobox
                                                id={`product-${item.key}`}
                                                products={products}
                                                value={item.product_id}
                                                onChange={(product) => pickProduct(item.key, product)}
                                            />
                                        )}
                                        {itemError(index, 'product_id') && <p className="text-xs text-destructive">{itemError(index, 'product_id')}</p>}
                                    </div>
                                    <FormField label="Name on form" htmlFor={`label-${item.key}`} error={itemError(index, 'label')} className="sm:col-span-3 lg:col-span-3">
                                        <Input id={`label-${item.key}`} value={item.label} onChange={(e) => updateItem(item.key, { label: e.target.value })} placeholder="e.g. Strawberry 1 kg" />
                                    </FormField>
                                    <FormField label="Stock units each" htmlFor={`uq-${item.key}`} error={itemError(index, 'unit_quantity')} className="sm:col-span-2 lg:col-span-2">
                                        {item.custom ? (
                                            <Input id={`uq-${item.key}`} disabled value="" placeholder="Not tracked" className="text-right" />
                                        ) : (
                                            <Input id={`uq-${item.key}`} type="number" min="1" step="1" inputMode="numeric" value={item.unit_quantity} onChange={(e) => updateItem(item.key, { unit_quantity: e.target.value })} className="text-right tabular-nums" />
                                        )}
                                    </FormField>
                                    <FormField label="Price (RM)" htmlFor={`price-${item.key}`} error={itemError(index, 'price')} className="sm:col-span-2 lg:col-span-1">
                                        <Input id={`price-${item.key}`} type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(item.key, { price: e.target.value })} className="text-right tabular-nums" />
                                    </FormField>
                                    <FormField label="Max / order" htmlFor={`max-${item.key}`} error={itemError(index, 'max_per_order')} className="sm:col-span-1 lg:col-span-1">
                                        <Input id={`max-${item.key}`} type="number" min="1" step="1" value={item.max_per_order} onChange={(e) => updateItem(item.key, { max_per_order: e.target.value })} placeholder="—" className="text-right tabular-nums" />
                                    </FormField>
                                    <FormField label="Quota" htmlFor={`quota-${item.key}`} error={itemError(index, 'quota')} className="sm:col-span-1 lg:col-span-1">
                                        <Input id={`quota-${item.key}`} type="number" min="0" step="1" value={item.quota} onChange={(e) => updateItem(item.key, { quota: e.target.value })} placeholder="∞" className="text-right tabular-nums" />
                                    </FormField>
                                    <div className="flex items-end justify-between gap-2 sm:col-span-6 lg:col-span-1 lg:h-full lg:flex-col lg:items-end lg:justify-end">
                                        {ordered > 0 && <span className="text-xs text-muted-foreground lg:hidden">{ordered} ordered</span>}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="ml-auto text-muted-foreground hover:text-destructive"
                                            disabled={data.items.length === 1 || ordered > 0}
                                            title={ordered > 0 ? `${ordered} already ordered. Set quota to 0 to stop new orders.` : 'Remove'}
                                            onClick={() => setData('items', data.items.filter((i) => i.key !== item.key))}
                                            aria-label="Remove item"
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                    {ordered > 0 && (
                                        <p className="hidden text-xs text-muted-foreground sm:col-span-6 lg:col-span-12 lg:block">
                                            {ordered} already ordered{item.quota !== '' ? `, ${Math.max(0, Number(item.quota) - ordered)} left` : ''}
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={() => setData('items', [...data.items, blankItem()])}>
                                    <Plus />Add product
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setData('items', [...data.items, blankItem(true)])}>
                                    <Plus />Add custom item
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Quota is the total units you can supply for this session. Leave max / order or quota empty for no limit.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={form.processing}>
                        {editing ? 'Save changes' : 'Create session & form'}
                    </Button>
                </div>
            </form>
        </InventoryPage>
    );
}
