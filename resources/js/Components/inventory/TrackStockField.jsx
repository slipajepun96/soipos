import { Plus, Trash2 } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import ProductCombobox from '@/Components/inventory/ProductCombobox';
import { cn } from '@/lib/utils';

const TYPES = [
    { value: 'stock', label: 'Keep stock', hint: 'Normal product: stock in, stock out and low stock alerts.' },
    { value: 'none', label: 'No stock', hint: 'Always sellable, no stock recorded, e.g. strawberries picked up on site.' },
    { value: 'bundle', label: 'Bakul', hint: 'A set of other products. Selling one takes stock out of each item; the receipt shows the Bakul.' },
];

/**
 * Unit or weight. Weight products are priced per kg and sold in kg (e.g. strawberries);
 * a Bakul is always sold by unit.
 */
export function SoldByField({ data, setData }) {
    if (data.is_bundle) return null;
    const options = [
        ['unit', 'By unit', 'Pack, bottle, piece…'],
        ['weight', 'By weight (kg)', 'Price per kg, weighed at the counter'],
    ];

    return (
        <div>
            <InputLabel value="Sold by" />
            <div className="mt-1 grid grid-cols-2 gap-2">
                {options.map(([value, label, hint]) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setData('sold_by', value)}
                        className={cn(
                            'rounded-md border p-2 text-left text-sm transition-colors',
                            (data.sold_by || 'unit') === value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent',
                        )}
                    >
                        <span className="block font-medium">{label}</span>
                        <span className="block text-xs text-muted-foreground">{hint}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/** Current stock type of the form data. */
const typeOf = (data) => (data.is_bundle ? 'bundle' : data.track_stock === false ? 'none' : 'stock');

/**
 * How a product's stock is kept: normal stock, no stock, or a Bakul (bundle) made of other
 * products, plus the low stock limit / Bakul items that go with it.
 * `products` = the store's products, for picking Bakul items; `selfId` = the product being edited.
 */
export default function TrackStockField({ data, setData, errors, products = [], selfId = null }) {
    const type = typeOf(data);
    const items = data.bundle_items ?? [];
    const choices = products.filter((p) => !p.is_bundle && p.id !== selfId && p.is_active != 0);

    const setType = (value) => setData((d) => ({
        ...d,
        track_stock: value === 'stock',
        is_bundle: value === 'bundle',
        sold_by: value === 'bundle' ? 'unit' : d.sold_by,
        bundle_items: value === 'bundle' && !(d.bundle_items ?? []).length ? [{ product_id: '', quantity: 1 }] : d.bundle_items ?? [],
    }));
    const setItems = (next) => setData('bundle_items', next);
    const updateItem = (index, patch) => setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

    const itemError = (index) => errors[`bundle_items.${index}.product_id`] || errors[`bundle_items.${index}.quantity`];

    return (
        <div className="space-y-3 md:col-span-2">
            <div>
                <InputLabel value="Stock" />
                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                    {TYPES.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setType(t.value)}
                            className={cn(
                                'rounded-md border p-2 text-left text-sm transition-colors',
                                type === t.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent',
                            )}
                        >
                            <span className="block font-medium">{t.label}</span>
                            <span className="block text-xs text-muted-foreground">{t.hint}</span>
                        </button>
                    ))}
                </div>
                <InputError message={errors.track_stock || errors.is_bundle} className="mt-2" />
            </div>

            {type === 'stock' && (
                <div>
                    <InputLabel
                        htmlFor="product_low_stock_limit"
                        value={<>Low Stock Limit ({data.sold_by === 'weight' ? 'kg' : 'units'})<span className="text-destructive">*</span></>}
                    />
                    <TextInput
                        id="product_low_stock_limit"
                        name="product_low_stock_limit"
                        value={data.product_low_stock_limit}
                        className="mt-1 block w-full"
                        onChange={(e) => setData('product_low_stock_limit', e.target.value)}
                        required
                    />
                    <InputError message={errors.product_low_stock_limit} className="mt-2" />
                </div>
            )}

            {type === 'bundle' && (
                <div className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                        <InputLabel value={<>Items in one Bakul<span className="text-destructive">*</span></>} />
                        <span className="text-xs text-muted-foreground">Qty per Bakul (kg for weighed items)</span>
                    </div>
                    {items.map((item, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex gap-2">
                                <div className="min-w-0 flex-1">
                                    <ProductCombobox
                                        products={choices}
                                        value={item.product_id}
                                        disabledIds={items.filter((_, i) => i !== index).map((i) => i.product_id)}
                                        onChange={(p) => updateItem(index, { product_id: p.id })}
                                    />
                                </div>
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    min="0.001"
                                    step={choices.find((p) => p.id === item.product_id)?.sold_by === 'weight' ? '0.001' : '1'}
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, { quantity: e.target.value })}
                                    className="w-20 text-right"
                                    aria-label="Quantity per Bakul"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                                    aria-label="Remove item"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <InputError message={itemError(index)} />
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { product_id: '', quantity: 1 }])}>
                        <Plus className="h-4 w-4" />Add item
                    </Button>
                    <InputError message={errors.bundle_items} />
                    <p className="text-xs text-muted-foreground">
                        The Bakul's price is split across its items by their selling price for the stock-out record.
                    </p>
                </div>
            )}
        </div>
    );
}
