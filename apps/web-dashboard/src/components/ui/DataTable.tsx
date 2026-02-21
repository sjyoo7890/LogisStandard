import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
}

export function DataTable<T extends Record<string, unknown>>({ columns, data, keyField }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
            {columns.map((col) => (
              <th key={col.key} className={`pb-2 ${col.className || ''}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={keyField ? String(row[keyField]) : i} className="border-b border-gray-50 dark:border-gray-700/50">
              {columns.map((col) => (
                <td key={col.key} className={`py-1.5 ${col.className || ''}`}>
                  {col.render ? col.render(row, i) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
