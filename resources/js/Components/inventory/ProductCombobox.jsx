import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';
import { formatQty, formatUnits, productLabel } from '@/lib/format';

/**
 * Searchable product picker. `available` (optional) is a map of product id to
 * stock on hand, shown next to each product.
 */
export default function ProductCombobox({ id, products, value, onChange, available, disabledIds = [], placeholder = 'Select product…' }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const selected = products.find((p) => String(p.id) === String(value));

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter((p) =>
            `${productLabel(p)} ${p.product_sku_code ?? ''}`.toLowerCase().includes(q),
        );
    }, [products, query]);

    return (
        <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(''); }}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground')}
                >
                    <span className="truncate">{selected ? productLabel(selected) : placeholder}</span>
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] min-w-72 p-0" align="start">
                <div className="flex items-center gap-2 border-b px-3">
                    <Search className="h-4 w-4 shrink-0 opacity-50" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name or SKU…"
                        className="h-10 w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
                    />
                </div>
                <div className="max-h-72 overflow-y-auto p-1">
                    {filtered.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">No product found.</p>
                    )}
                    {filtered.map((product) => {
                        const isSelected = String(product.id) === String(value);
                        const isDisabled = !isSelected && disabledIds.map(String).includes(String(product.id));
                        return (
                            <button
                                key={product.id}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => { onChange(product); setOpen(false); setQuery(''); }}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
                            >
                                <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate">{productLabel(product)}</span>
                                    {product.product_sku_code && (
                                        <span className="block truncate text-xs text-muted-foreground">SKU {product.product_sku_code}</span>
                                    )}
                                </span>
                                {available && (
                                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                        {(product.track_stock === false && !product.is_bundle) || available[product.id] === null ? 'No stock kept' : formatUnits(available[product.id] || 0, product)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
