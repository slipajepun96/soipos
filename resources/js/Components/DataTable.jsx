import React, { useState } from 'react';

export default function DataTable({ columns, data, className = "", showSearch = true }) {
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
                        placeholder="Search..."
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            )}

            {/* Table */}
            
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="min-w-full border-collapse bg-white">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.accessor || column.Header}
                                    className="p-4 text-left text-xs border-gray-200 bg-gray-50 text-gray-500 uppercase border-b"
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
                                    No data found
                                </td>
                            </tr>
                        )}

                        <tr>
                            <div className=" text-sm text-gray-600 px-4 py-2 ">
                                Showing <b>{filteredData.length}</b> of <b>{data.length}</b> rows.
                            </div>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* Row Count Summary */}


        </div>
    );
}