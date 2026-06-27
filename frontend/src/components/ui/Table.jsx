import React from 'react';
import { FiChevronUp, FiChevronDown, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Table({ 
  columns, 
  data, 
  isLoading, 
  onSort, 
  sortColumn, 
  sortDirection,
  emptyMessage = "No data available"
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/5">
      <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-dark-800 dark:text-slate-300 border-b border-slate-200 dark:border-white/5">
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                className={`px-6 py-4 ${col.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors' : ''} ${col.className || ''}`}
                onClick={() => col.sortable && onSort && onSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.header}
                  {col.sortable && sortColumn === col.key && (
                    sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`} className="bg-white border-b last:border-b-0 dark:bg-dark-900 border-slate-100 dark:border-white/5">
                {columns.map((_, colIndex) => (
                  <td key={`skeleton-col-${colIndex}`} className="px-6 py-5 whitespace-nowrap">
                    <div className={`skeleton-loader h-4 w-${colIndex === 0 ? '3/4' : '1/2'} rounded-full opacity-70`}></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            <AnimatePresence mode="popLayout">
              {data.map((row, rowIndex) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.2 }}
                  key={row._id || row.id || rowIndex} 
                  className="bg-white border-b last:border-b-0 dark:bg-dark-900 border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  );
}
