import { router } from '@inertiajs/react';
import { FileDown } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import InventoryPage from '@/Components/inventory/InventoryPage';
import ProductCombobox from '@/Components/inventory/ProductCombobox';
import DatePicker from '@/Components/inventory/DatePicker';
import DocumentDialog from '@/Components/inventory/DocumentDialog';
import FormField from '@/Components/inventory/FormField';
import { DOC_TYPES, formatDate, formatMoney, formatQty } from '@/lib/format';

export default function StockCard({ products = [], filters, product, card }) {
    const apply = (patch) => {
        router.get(route('inventory.stockCard'), { ...filters, ...patch }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const unit = product?.product_unit ?? '';

    return (
        <InventoryPage
            title="Stock Card"
            description="Every movement of a product with its running balance."
            backHref={route('inventory.index')}
            actions={card && (
                <Button variant="outline" asChild>
                    <a href={route('inventory.stockCard.pdf', filters)}>
                        <FileDown />
                        Download PDF
                    </a>
                </Button>
            )}
        >
            <Card>
                <CardContent className="grid gap-4 pt-6 md:grid-cols-[2fr_1fr_1fr]">
                    <FormField label="Product" htmlFor="product">
                        <ProductCombobox
                            id="product"
                            products={products}
                            value={filters.product_id}
                            onChange={(p) => apply({ product_id: p.id })}
                        />
                    </FormField>
                    <FormField label="From" htmlFor="from">
                        <DatePicker id="from" value={filters.from} onChange={(v) => v && apply({ from: v })} />
                    </FormField>
                    <FormField label="To" htmlFor="to">
                        <DatePicker id="to" value={filters.to} onChange={(v) => v && apply({ to: v })} />
                    </FormField>
                </CardContent>
            </Card>

            {!product && (
                <Card>
                    <CardContent className="py-16 text-center text-sm text-muted-foreground">
                        Choose a product to see its stock card.
                    </CardContent>
                </Card>
            )}

            {product && card && (
                <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <Stat label="Opening balance" value={card.opening} unit={unit} hint={`Before ${formatDate(filters.from)}`} />
                        <Stat label="Total in" value={card.total_in} unit={unit} prefix="+" />
                        <Stat label="Total out" value={card.total_out} unit={unit} prefix="−" />
                        <Stat label="Closing balance" value={card.closing} unit={unit} hint={`As at ${formatDate(filters.to)}`} strong />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{product.product_name}</CardTitle>
                            <CardDescription>
                                {product.product_sku_code && <>SKU {product.product_sku_code} · </>}
                                {product.product_num_of_measure} {unit} · {formatDate(filters.from)} – {formatDate(filters.to)}
                            </CardDescription>
                        </CardHeader>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Date</TableHead>
                                    <TableHead>Document</TableHead>
                                    <TableHead>Party / Remarks</TableHead>
                                    <TableHead className="text-right">In</TableHead>
                                    <TableHead className="text-right">Out</TableHead>
                                    <TableHead className="text-right">Unit cost</TableHead>
                                    <TableHead className="pr-6 text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableCell className="pl-6">{formatDate(filters.from)}</TableCell>
                                    <TableCell colSpan={5} className="text-muted-foreground">Opening balance</TableCell>
                                    <TableCell className="pr-6 text-right font-medium tabular-nums">{formatQty(card.opening)}</TableCell>
                                </TableRow>
                                {card.movements.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="whitespace-nowrap pl-6">{formatDate(m.date)}</TableCell>
                                        <TableCell>
                                            {m.doc ? (
                                                <DocumentDialog
                                                    doc={m.doc}
                                                    trigger={(
                                                        <button type="button" className="font-medium underline-offset-4 hover:underline">
                                                            {m.doc_num}
                                                        </button>
                                                    )}
                                                />
                                            ) : (
                                                <span className="font-medium">{m.doc_num}</span>
                                            )}
                                            <div>
                                                <Badge variant="outline" className="mt-1 font-normal">
                                                    {DOC_TYPES[m.doc_type]?.short || m.doc_type}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <div className="truncate">{m.party || '—'}</div>
                                            {m.remarks && <div className="truncate text-xs text-muted-foreground">{m.remarks}</div>}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{m.in ? formatQty(m.in) : ''}</TableCell>
                                        <TableCell className="text-right tabular-nums">{m.out ? formatQty(m.out) : ''}</TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">{formatMoney(m.unit_cost)}</TableCell>
                                        <TableCell className="pr-6 text-right font-medium tabular-nums">{formatQty(m.balance)}</TableCell>
                                    </TableRow>
                                ))}
                                {card.movements.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            No movements in this period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={3} className="pl-6">Closing balance</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatQty(card.total_in)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatQty(card.total_out)}</TableCell>
                                    <TableCell />
                                    <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatQty(card.closing)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </Card>
                </>
            )}
        </InventoryPage>
    );
}

function Stat({ label, value, unit, hint, prefix = '', strong = false }) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className={`mt-1 text-2xl tabular-nums ${strong ? 'font-bold' : 'font-semibold'}`}>
                    {value ? prefix : ''}{formatQty(value)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
                </p>
                {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            </CardContent>
        </Card>
    );
}
