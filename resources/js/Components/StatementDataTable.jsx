import React, { useState } from 'react';

export default function StatementDataTable({ columns, data, className = "", showSearch = true }) {
    const [search, setSearch] = useState('');

    // Filter data based on search input
    const filteredData = data.filter((row) =>
        columns.some((column) => {
            if (Array.isArray(column.accessor)) {
                // If accessor is an array, check all fields in the array
                return column.accessor.some((key) =>
                    row[key]?.toString().toLowerCase().includes(search.toLowerCase())
                );
            } else {
                // Otherwise, check the single accessor field
                return row[column.accessor]
                    ?.toString()
                    .toLowerCase()
                    .includes(search.toLowerCase());
            }
        })
    );

    return (
        <div className={className}>
            {/* Search Input */}
            {showSearch && (
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Cari..."
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            )}

            {/* Table */}
            {/* <div className="mt-4 text-sm text-gray-600">
                Menunjukkan {filteredData.length} daripada {data.length} baris.
            </div> */}
            
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-200">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.accessor || column.Header}
                                    className="px-4 py-2 text-left  border-gray-200 bg-gray-100"
                                >
                                    {column.Header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                                {columns.map((column) => (
                                    <td
                                        key={column.accessor || column.Header}
                                        className="px-4 py-2 border-b border-gray-200"
                                    >
                                         {/* Check if the column has a custom Cell property */}
                                         {column.Cell
                                            ? column.Cell({ row }) // Render custom Cell
                                            : row[column.accessor]} {/* Render default accessor */}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-2 text-center text-gray-500"
                                >
                                    Tiada data ditemukan
                                </td>
                            </tr>
                        )}
                        {/* total row */}
                        <tr>
                            <td
                                colSpan={columns.length - 1}
                                className="px-4 py-2 text-right text-lg uppercase font-bold bg-gray-900 text-white"
                            >
                                Jumlah
                            </td>
                            <td className="px-4 py-2 text-lg uppercase font-bold text-right bg-gray-900 text-white">
                                RM {parseFloat(filteredData.reduce((acc, row) => {
                                    if (row.transaction_type === 'debit') {
                                        acc += parseFloat(row.transaction_amount || 0);
                                    } else if (row.transaction_type === 'credit') {
                                        acc -= parseFloat(row.transaction_amount || 0);
                                    }
                                    return acc;
                                }, 0)).toLocaleString('ms-MY', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
}