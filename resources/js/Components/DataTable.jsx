import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { cn } from '@/lib/utils';

const columnKey = (column, index) =>
    (Array.isArray(column.accessor) ? column.accessor.join('-') : column.accessor) || column.Header || index;

export default function DataTable({ columns, data, className = '', showSearch = true }) {
    const [search, setSearch] = useState('');
    const term = search.toLowerCase();

    const filteredData = data.filter((row) =>
        columns.some((column) => {
            const keys = Array.isArray(column.accessor) ? column.accessor : [column.accessor];
            return keys.some((key) => row[key]?.toString().toLowerCase().includes(term));
        }),
    );

    return (
        <div className={cn('overflow-hidden rounded-xl border bg-card', className)}>
            {showSearch && (
                <div className="border-b p-4">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search…"
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableHead key={columnKey(column, index)} className="first:pl-4 last:pr-4">
                                {column.Header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((row, rowIndex) => (
                        <TableRow key={row.id ?? rowIndex}>
                            {columns.map((column, index) => (
                                <TableCell key={columnKey(column, index)} className="first:pl-4 last:pr-4">
                                    {column.Cell ? column.Cell({ row }) : row[column.accessor]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                    {filteredData.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                                No data found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                Showing {filteredData.length} of {data.length} rows
            </div>
        </div>
    );
}
