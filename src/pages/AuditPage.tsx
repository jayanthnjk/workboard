import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, LoadingSpinner } from '@/components/common'
import type { Column } from '@/components/common/DataTable'
import type { AuditEntry, AuditAction, AuditEntityType } from '@/types'

const AuditPage = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    action: '' as AuditAction | '',
    entityType: '' as AuditEntityType | '',
    dateFrom: '',
    dateTo: '',
    search: '',
  })
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)

  useEffect(() => { loadData() }, [page])

  const loadData = async () => {
    setLoading(true)
    const res = await apiGateway.getAuditEntries(page, 20)
    setEntries(res.data)
    setTotalPages(res.totalPages)
    setLoading(false)
  }

  const actionColors: Record<AuditAction, string> = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    login: 'bg-purple-100 text-purple-800',
    logout: 'bg-gray-100 text-gray-800',
  }

  const filteredEntries = entries.filter(e => {
    if (filters.action && e.action !== filters.action) return false
    if (filters.entityType && e.entityType !== filters.entityType) return false
    if (filters.dateFrom && e.timestamp < filters.dateFrom) return false
    if (filters.dateTo && e.timestamp > filters.dateTo) return false
    if (filters.search) {
      const search = filters.search.toLowerCase()
      if (!e.userName.toLowerCase().includes(search) && !e.entityName?.toLowerCase().includes(search)) return false
    }
    return true
  })

  const columns: Column<AuditEntry>[] = [
    { 
      key: 'timestamp', 
      header: 'Time', 
      accessor: (row) => new Date(row.timestamp).toLocaleString(),
      rawValue: (row) => row.timestamp,
      sortable: true 
    },
    { 
      key: 'userName', 
      header: 'User', 
      accessor: (row) => row.userName,
      rawValue: (row) => row.userName,
      sortable: true 
    },
    {
      key: 'action',
      header: 'Action',
      accessor: (row) => (
        <span className={`px-2 py-1 rounded text-xs ${actionColors[row.action]}`}>{row.action}</span>
      ),
      rawValue: (row) => row.action,
    },
    { 
      key: 'entityType', 
      header: 'Entity Type',
      accessor: (row) => row.entityType,
      rawValue: (row) => row.entityType,
    },
    { 
      key: 'entityName', 
      header: 'Entity',
      accessor: (row) => row.entityName || '-',
      rawValue: (row) => row.entityName || '',
    },
    {
      key: 'details',
      header: 'Details',
      accessor: (row) => (
        <button onClick={() => setSelectedEntry(row)} className="text-blue-600 hover:underline text-sm">View</button>
      ),
    },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Audit Log</h1>

      <div className="bg-white dark:bg-gray-800 rounded shadow p-4 mb-6">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input type="text" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="User or entity..." className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value as AuditAction })} className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600">
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Entity Type</label>
            <select value={filters.entityType} onChange={e => setFilters({ ...filters, entityType: e.target.value as AuditEntityType })} className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600">
              <option value="">All Types</option>
              <option value="employee">Employee</option>
              <option value="department">Department</option>
              <option value="shift-assignment">Shift Assignment</option>
              <option value="leave-request">Leave Request</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filteredEntries} keyExtractor={(row) => row.id} />

      <div className="flex justify-between items-center mt-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded disabled:opacity-50">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded disabled:opacity-50">Next</button>
      </div>

      <div className="mt-4">
        <button className="px-4 py-2 bg-primary text-white rounded text-sm">Export Audit Log</button>
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEntry(null)}>
          <div className="bg-white dark:bg-gray-800 rounded shadow-lg p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Audit Entry Details</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Time:</span> {new Date(selectedEntry.timestamp).toLocaleString()}</div>
              <div><span className="font-medium">User:</span> {selectedEntry.userName}</div>
              <div><span className="font-medium">Action:</span> {selectedEntry.action}</div>
              <div><span className="font-medium">Entity:</span> {selectedEntry.entityType} - {selectedEntry.entityName}</div>
              {selectedEntry.beforeValue && (
                <div>
                  <span className="font-medium">Before:</span>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 text-xs overflow-auto">{JSON.stringify(selectedEntry.beforeValue, null, 2)}</pre>
                </div>
              )}
              {selectedEntry.afterValue && (
                <div>
                  <span className="font-medium">After:</span>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 text-xs overflow-auto">{JSON.stringify(selectedEntry.afterValue, null, 2)}</pre>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedEntry(null)} className="mt-4 px-4 py-2 bg-primary text-white rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditPage
