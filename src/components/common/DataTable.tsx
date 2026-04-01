import { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import { LoadingSpinner } from './LoadingSpinner'

export interface Column<T> {
  key: string
  header: string
  accessor: (row: T) => React.ReactNode
  rawValue?: (row: T) => string | number // For filtering/sorting on raw data
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'select' | 'date'
  filterOptions?: { value: string; label: string }[]
  width?: string
  hidden?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  loading?: boolean
  emptyMessage?: string
  selectable?: boolean
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onRowClick?: (row: T) => void
  pageSize?: number
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data available',
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  onRowClick,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [visibleColumns, _setVisibleColumns] = useState<string[]>(
    columns.filter(c => !c.hidden).map(c => c.key)
  )

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true
        const column = columns.find(c => c.key === key)
        if (!column) return true
        
        // Use rawValue if available, otherwise try to extract text from accessor
        let cellValue: string
        if (column.rawValue) {
          cellValue = String(column.rawValue(row)).toLowerCase()
        } else {
          const accessorResult = column.accessor(row)
          // If it's a React element, we can't filter on it properly
          if (typeof accessorResult === 'string' || typeof accessorResult === 'number') {
            cellValue = String(accessorResult).toLowerCase()
          } else {
            // For complex JSX, skip filtering or use a fallback
            cellValue = ''
          }
        }
        
        return cellValue.includes(value.toLowerCase())
      })
    })
  }, [data, filters, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    
    const column = columns.find(c => c.key === sortKey)
    if (!column) return filteredData
    
    return [...filteredData].sort((a, b) => {
      let aValue: string
      let bValue: string
      
      if (column.rawValue) {
        aValue = String(column.rawValue(a))
        bValue = String(column.rawValue(b))
      } else {
        const aResult = column.accessor(a)
        const bResult = column.accessor(b)
        aValue = typeof aResult === 'string' || typeof aResult === 'number' ? String(aResult) : ''
        bValue = typeof bResult === 'string' || typeof bResult === 'number' ? String(bResult) : ''
      }
      
      const comparison = aValue.localeCompare(bValue)
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortKey, sortDirection, columns])

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return
    
    const allIds = paginatedData.map(keyExtractor)
    const allSelected = allIds.every(id => selectedRows.includes(id))
    
    if (allSelected) {
      onSelectionChange(selectedRows.filter(id => !allIds.includes(id)))
    } else {
      onSelectionChange([...new Set([...selectedRows, ...allIds])])
    }
  }

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return
    
    if (selectedRows.includes(id)) {
      onSelectionChange(selectedRows.filter(i => i !== id))
    } else {
      onSelectionChange([...selectedRows, id])
    }
  }

  const visibleColumnsList = columns.filter(c => visibleColumns.includes(c.key))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {columns
          .filter(c => c.filterable && visibleColumns.includes(c.key))
          .map(column => (
            <div key={column.key} className="flex-1 min-w-[200px]">
              <label className="label">{column.header}</label>
              {column.filterType === 'select' ? (
                <select
                  value={filters[column.key] || ''}
                  onChange={e => setFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                  className="input"
                >
                  <option value="">All</option>
                  {column.filterOptions?.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={column.filterType === 'date' ? 'date' : 'text'}
                  value={filters[column.key] || ''}
                  onChange={e => setFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                  placeholder={`Filter by ${column.header.toLowerCase()}`}
                  className="input"
                />
              )}
            </div>
          ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full">
          <thead className="bg-[var(--color-bg-main)]">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every(row => selectedRows.includes(keyExtractor(row)))}
                    onChange={handleSelectAll}
                    className="rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                  />
                </th>
              )}
              {visibleColumnsList.map(column => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-4 py-3 text-left text-sm font-medium text-[var(--color-text-medium)]',
                    column.sortable && 'cursor-pointer hover:bg-[var(--color-border-light)]'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortKey === column.key && (
                      <svg
                        className={clsx('w-4 h-4 transition-transform', sortDirection === 'desc' && 'rotate-180')}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-light)]">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumnsList.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-[var(--color-text-light)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map(row => {
                const id = keyExtractor(row)
                const isSelected = selectedRows.includes(id)
                
                return (
                  <tr
                    key={id}
                    className={clsx(
                      'bg-[var(--color-bg-card)] transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-[var(--color-bg-main)]',
                      isSelected && 'bg-[var(--color-primary)]/5'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                          className="rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                        />
                      </td>
                    )}
                    {visibleColumnsList.map(column => (
                      <td key={column.key} className="px-4 py-3 text-sm">
                        {column.accessor(row)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-light)]">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--color-text-medium)]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
