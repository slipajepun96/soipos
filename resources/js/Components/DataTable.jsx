import React, { useState } from 'react';

export default function DataTable({ columns, data }) {
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
        <div className="p-4 ">
            {/* Search Input */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}

            
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse ">
                    <thead className=''>
                        <tr className='rounded-xl'>
                            {columns.map((column) => (
                                <th
                                    key={column.accessor || column.Header}
                                    className="px-4 py-2 text-left bg-gray-100"
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
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-sm text-gray-600">
                Shows {filteredData.length} of {data.length} entries.
            </div>

        </div>
    );
}