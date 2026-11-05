import { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ScrollText, Search } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { formatMoney, formatQty } from '@/lib/format';
import { cn } from '@/lib/utils';

export const isLowStock = (row) => {
    const limit = Number(row.product_low_stock_limit || 0);
    return limit > 0 && Number(row.balance) <= limit;
};

export default function BalanceTable({ balance }) {
    const [query, setQuery] = useState('');
    const [lowOnly, setLowOnly] = useState(false);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return balance.filter((row) => {
            if (lowOnly && !isLowStock(row)) return false;
            if (!q) return true;
            return `${row.product_name} ${row.product_sku_code ?? ''}`.toLowerCase().includes(q);
        });
    }, [balance, query, lowOnly]);

    return (
        <Card>
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="pl-8" />
                </div>
                <Button variant={lowOnly ? 'default' : 'outline'} size="sm" onClick={() => setLowOnly(!lowOnly)}>
                    Low stock only
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="pl-4">Product</TableHead>
                        <TableHead className="text-right">In</TableHead>
                        <TableHead className="text-right">Out</TableHead>
                        <TableHead className="text-right">On hand</TableHead>
                        <TableHead className="text-right">Avg cost (RM)</TableHead>
                        <TableHead className="text-right">Value (RM)</TableHead>
                        <TableHead className="w-12 pr-4" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => {
                        const low = isLowStock(row);
                        return (
                            <TableRow key={row.product_id}>
                                <TableCell className="pl-4">
                                    <div className="font-medium">{row.product_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {row.product_sku_code ? `SKU ${row.product_sku_code} · ` : ''}
                                        {row.product_num_of_measure} {row.product_unit}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">{formatQty(row.total_in)}</TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">{formatQty(row.total_out)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {low && <Badge variant="destructive">Low</Badge>}
                                        <span className={cn('font-semibold tabular-nums', low && 'text-destructive')}>
                                            {formatQty(row.balance)}
                                        </span>
                                    </div>
                                    {Number(row.product_low_stock_limit) > 0 && (
                                        <div className="text-xs text-muted-foreground">min {formatQty(row.product_low_stock_limit)}</div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{formatMoney(row.average_cost)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatMoney(row.stock_value)}</TableCell>
                                <TableCell className="pr-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                        <Link href={route('inventory.stockCard', { product_id: row.product_id })} aria-label="Stock card">
                                            <ScrollText />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No products found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                {rows.length} of {balance.length} products
            </div>
        </Card>
    );
}
