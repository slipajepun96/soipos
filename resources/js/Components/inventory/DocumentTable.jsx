import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileDown, Search } from 'lucide-react';
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
import { DOC_TYPES, formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import DocumentDialog from './DocumentDialog';
import DeleteDocumentButton from './DeleteDocumentButton';

const PAGE_SIZE = 15;

/**
 * List of stock documents with search, a type filter, paging and row actions.
 */
export default function DocumentTable({ docs, types, deleteRoute, partyLabel = 'Party', showSales = false }) {
    const [query, setQuery] = useState('');
    const [type, setType] = useState('all');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return docs.filter((doc) => {
            if (type !== 'all' && doc.stock_doc_type !== type) return false;
            if (!q) return true;
            return [doc.stock_doc_num, doc.id, doc.stock_doc_supplier_name, doc.stock_doc_supplier_rob_num, doc.remarks]
                .some((value) => value && String(value).toLowerCase().includes(q));
        });
    }, [docs, query, type]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const colCount = showSales ? 6 : 5;

    return (
        <Card>
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        placeholder="Search documents…"
                        className="pl-8"
                    />
                </div>
                {types.length > 1 && (
                    <div className="inline-flex rounded-md border p-0.5">
                        {['all', ...types].map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => { setType(value); setPage(1); }}
                                className={cn(
                                    'rounded px-3 py-1 text-sm transition-colors',
                                    type === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {value === 'all' ? 'All' : DOC_TYPES[value]?.short || value}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="pl-4">Document</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>{partyLabel}</TableHead>
                        <TableHead className="text-right">Cost (RM)</TableHead>
                        {showSales && <TableHead className="text-right">Sales (RM)</TableHead>}
                        <TableHead className="w-32 pr-4 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="pl-4">
                                <div className="font-medium">{doc.stock_doc_num || doc.id}</div>
                                <Badge variant="outline" className="mt-1 font-normal">
                                    {DOC_TYPES[doc.stock_doc_type]?.label || doc.stock_doc_type}
                                </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(doc.stock_doc_date)}</TableCell>
                            <TableCell>
                                <div>{doc.stock_doc_supplier_name || '—'}</div>
                                {doc.stock_doc_supplier_rob_num && (
                                    <div className="text-xs text-muted-foreground">{doc.stock_doc_supplier_rob_num}</div>
                                )}
                                {!doc.stock_doc_supplier_rob_num && doc.remarks && (
                                    <div className="max-w-xs truncate text-xs text-muted-foreground">{doc.remarks}</div>
                                )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{formatMoney(doc.stock_doc_total_cost)}</TableCell>
                            {showSales && (
                                <TableCell className="text-right tabular-nums">
                                    {doc.stock_doc_total_sales_price != null ? formatMoney(doc.stock_doc_total_sales_price) : '—'}
                                </TableCell>
                            )}
                            <TableCell className="pr-4">
                                <div className="flex justify-end gap-1">
                                    <DocumentDialog doc={doc} />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                        <a href={route('inventory.documents.pdf', doc.id)} aria-label="Download PDF">
                                            <FileDown />
                                        </a>
                                    </Button>
                                    <DeleteDocumentButton doc={doc} deleteRoute={deleteRoute} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={colCount} className="py-12 text-center text-muted-foreground">
                                {docs.length === 0 ? 'No documents yet.' : 'No documents match your search.'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
                <span>
                    {filtered.length} of {docs.length} documents
                </span>
                {pageCount > 1 && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                            <ChevronLeft />
                        </Button>
                        <span className="tabular-nums">{currentPage} / {pageCount}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                            <ChevronRight />
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
