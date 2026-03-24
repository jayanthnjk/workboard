import { useState, useEffect, useMemo } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { useLanguage } from '@/context/LanguageContext'
import { LoadingSpinner } from '@/components/common'
import { Pagination } from '@/components/common/Pagination'
import type { AuditEntry, AuditAction, AuditEntityType } from '@/types'

export default function AuditPage() {
  const { t } = useLanguage()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalEntries, setTotalEntries] = useState(0)
  const [filters, setFilters] = useState({
    action: '' as AuditAction | '',
    entityType: '' as AuditEntityType | '',
    dateFrom: '',
    dateTo: '',
    search: '',
  })
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)

  useEffect(() => { 
    loadData() 
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') loadData() }
    const handleFocus = () => loadData()
    const handleDataChange = (event: CustomEvent) => { if (event.detail.type === 'audit-entry') loadData() }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('workboard-data-changed', handleDataChange as EventListener)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('workboard-data-changed', handleDataChange as EventListener)
    }
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    const res = await apiGateway.getAuditEntries(page, pageSize)
    setEntries(res.data)
    setTotalEntries(res.total)
    setLoading(false)
  }

  const actionColors: Record<AuditAction, string> = {
    create: 'badge-success',
    update: 'badge-info',
    delete: 'badge-error',
    login: 'badge-primary',
    logout: 'bg-[var(--color-bg-main)] text-[var(--color-text-medium)]',
  }

  const filteredEntries = useMemo(() => entries.filter(e => {
    if (filters.action && e.action !== filters.action) return false
    if (filters.entityType && e.entityType !== filters.entityType) return false
    if (filters.dateFrom && e.timestamp < filters.dateFrom) return false
    if (filters.dateTo && e.timestamp > filters.dateTo) return false
    if (filters.search) {
      const search = filters.search.toLowerCase()
      if (!e.userName.toLowerCase().includes(search) && !e.entityName?.toLowerCase().includes(search)) return false
    }
    return true
  }), [entries, filters])

  const stats = useMemo(() => ({
    total: entries.length,
    creates: entries.filter(e => e.action === 'create').length,
    updates: entries.filter(e => e.action === 'update').length,
    deletes: entries.filter(e => e.action === 'delete').length,
  }), [entries])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('audit_title')}</h1>
          <p className="page-subtitle">{t('audit_subtitle')}</p>
        </div>
        <button className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {t('export_log')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: stats.total, iconClass: 'stat-icon-info' },
          { label: 'Creates', value: stats.creates, iconClass: 'stat-icon-success' },
          { label: 'Updates', value: stats.updates, iconClass: 'stat-icon-warning' },
          { label: 'Deletes', value: stats.deletes, iconClass: 'stat-icon-error' },
        ].map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={stat.iconClass}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-dark)]">{stat.value}</p>
                <p className="text-xs text-[var(--color-text-medium)]">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">Search</label>
            <div className="search-input">
              <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="User or entity..." className="flex-1 bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">Action</label>
            <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value as AuditAction })} className="input">
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">Entity Type</label>
            <select value={filters.entityType} onChange={e => setFilters({ ...filters, entityType: e.target.value as AuditEntityType })} className="input">
              <option value="">All Types</option>
              <option value="employee">Employee</option>
              <option value="department">Department</option>
              <option value="shift-assignment">Shift Assignment</option>
              <option value="leave-request">Leave Request</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">From</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">To</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="input" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Entity Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Entity</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-medium)] uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredEntries.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-medium)]">No audit entries found</td></tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="table-row">
                    <td className="px-4 py-3 text-sm text-[var(--color-text-medium)]">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-xs font-semibold text-[var(--color-primary)]">
                          {entry.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-dark)]">{entry.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`badge capitalize ${actionColors[entry.action]}`}>{entry.action}</span></td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-medium)] capitalize">{entry.entityType.replace(/-/g, ' ')}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-dark)]">{entry.entityName || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedEntry(entry)} className="text-sm text-[var(--color-primary)] hover:underline">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredEntries.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={totalEntries}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-dark)]">Audit Entry Details</h3>
              <button onClick={() => setSelectedEntry(null)} className="p-1 hover:bg-[var(--color-bg-main)] rounded">
                <svg className="w-5 h-5 text-[var(--color-text-medium)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-medium)]">Time</span>
                <span className="text-[var(--color-text-dark)] font-medium">{new Date(selectedEntry.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-medium)]">User</span>
                <span className="text-[var(--color-text-dark)] font-medium">{selectedEntry.userName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-medium)]">Action</span>
                <span className={`badge capitalize ${actionColors[selectedEntry.action]}`}>{selectedEntry.action}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-medium)]">Entity</span>
                <span className="text-[var(--color-text-dark)] font-medium">{selectedEntry.entityType} - {selectedEntry.entityName}</span>
              </div>
              {selectedEntry.beforeValue && (
                <div className="py-2">
                  <span className="text-[var(--color-text-medium)] block mb-2">Before:</span>
                  <pre className="bg-[var(--color-bg-main)] p-3 rounded-lg text-xs overflow-auto max-h-32 border border-[var(--color-border)]">{JSON.stringify(selectedEntry.beforeValue, null, 2)}</pre>
                </div>
              )}
              {selectedEntry.afterValue && (
                <div className="py-2">
                  <span className="text-[var(--color-text-medium)] block mb-2">After:</span>
                  <pre className="bg-[var(--color-bg-main)] p-3 rounded-lg text-xs overflow-auto max-h-32 border border-[var(--color-border)]">{JSON.stringify(selectedEntry.afterValue, null, 2)}</pre>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedEntry(null)} className="mt-6 w-full btn btn-primary">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
