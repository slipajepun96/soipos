import { Link } from '@inertiajs/react';
import { Boxes, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
    { label: 'Stock', route: 'inventory.index', match: ['inventory.*'], icon: Boxes },
    { label: 'Products', route: 'product.index', match: ['product.*', 'productCategories.*'], icon: Package },
    { label: 'Suppliers', route: 'supplier.index', match: ['supplier.*'], icon: Truck },
];

/** Switches between the three parts of Inventory: stock, products and suppliers. */
export default function InventoryTabs({ className }) {
    return (
        <nav className={cn('inline-flex rounded-lg border bg-muted p-1', className)} aria-label="Inventory">
            {TABS.map(({ label, route: name, match, icon: Icon }) => {
                const active = match.some((pattern) => route().current(pattern));
                return (
                    <Link
                        key={label}
                        href={route(name)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                            active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                        aria-current={active ? 'page' : undefined}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
