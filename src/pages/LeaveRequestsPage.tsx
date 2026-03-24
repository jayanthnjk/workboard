import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Pagination } from '@/components/common/Pagination'
import { kpLeaveBalances, personnel } from '@/data/seedData'
import type { KPLeaveType, RequestStatus } from '@/types'

const KP_LEAVE_TYPES: { value: KPLeaveType; label: string }[] = [
  { value: 'CL', label: 'Casual Leave' },
  { value: 'CML', label: 'Medical Leave' },
  { value: 'EL', label: 'Earned Leave' },
  { value: 'PL', label: 'Privilege Leave' },
]

interface KPLeaveRequest {
  id: string
  personnelId: string
  personnelName: string
  leaveType: KPLeaveType
  startDate: string
  endDate: string
  reason: string
  status: RequestStatus
  createdAt: string
}

export default function LeaveRequestsPage() {
  const navigate = useNavigate()
  useAuth()
  const { t } = useLanguage()
  const [requests, setRequests] = useState<KPLeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<KPLeaveType | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const sampleRequests: KPLeaveRequest[] = personnel.slice(0, 20).map((p, i) => ({
      id: `kp-leave-${i + 1}`,
      personnelId: p.personnelId,
      personnelName: p.name,
      leaveType: KP_LEAVE_TYPES[i % 4].value,
      startDate: `2026-03-${String(15 + (i % 10)).padStart(2, '0')}`,
      endDate: `2026-03-${String(17 + (i % 10)).padStart(2, '0')}`,
      reason: ['Personal work', 'Medical appointment', 'Family function', 'Health issues'][i % 4],
      status: ['pending', 'approved', 'rejected', 'pending'][i % 4] as RequestStatus,
      createdAt: '2026-03-10T00:00:00Z',
    }))
    setRequests(sampleRequests)
    setLoading(false)
  }, [])

  const userLeaveBalance = useMemo(() => kpLeaveBalances[0]?.balances || [], [])

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false
      if (typeFilter && r.leaveType !== typeFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!r.personnelName.toLowerCase().includes(q) && !r.personnelId.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [requests, statusFilter, typeFilter, searchQuery])

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1) }, [statusFilter, typeFilter, searchQuery])

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRequests.slice(start, start + pageSize)
  }, [filteredRequests, currentPage, pageSize])

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }), [requests])

  const handleApprove = (id: string) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' as RequestStatus } : r))
  const handleReject = (id: string) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as RequestStatus } : r))

  const getStatusColor = (status: RequestStatus) => {
    const colors = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-error',
      cancelled: 'bg-[var(--color-bg-main)] text-[var(--color-text-medium)]',
    }
    return colors[status]
  }

  const getTypeColor = (type: KPLeaveType) => {
    const colors = { CL: 'badge-info', CML: 'badge-error', EL: 'badge-success', PL: 'badge-primary' }
    return colors[type]
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('leave_title')}</h1>
          <p className="page-subtitle">{t('manage_leave')}</p>
        </div>
        <button onClick={() => navigate('/leave-requests/new')} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          {t('request_leave_btn')}
        </button>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {userLeaveBalance.map(b => (
          <div key={b.type} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`badge ${getTypeColor(b.type as KPLeaveType)}`}>{b.type}</span>
              <span className="text-xs text-[var(--color-text-medium)]">{b.entitled} days</span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-dark)]">{b.remaining}</p>
            <p className="text-xs text-[var(--color-text-medium)]">remaining of {b.entitled}</p>
            <div className="mt-2 h-1.5 bg-[var(--color-bg-main)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${(b.remaining / b.entitled) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: stats.total, iconClass: 'stat-icon-info' },
          { label: 'Pending', value: stats.pending, iconClass: 'stat-icon-warning' },
          { label: 'Approved', value: stats.approved, iconClass: 'stat-icon-success' },
          { label: 'Rejected', value: stats.rejected, iconClass: 'stat-icon-error' },
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
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="search-input">
              <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or ID..." className="flex-1 bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as RequestStatus)} className="input w-auto">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as KPLeaveType)} className="input w-auto">
              <option value="">All Types</option>
              {KP_LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Personnel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-medium)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {filteredRequests.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-medium)]">{t('no_leave_requests')}</td></tr>
              ) : (
                paginatedRequests.map(req => (
                  <tr key={req.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-xs font-semibold text-[var(--color-primary)]">
                          {req.personnelName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-dark)]">{req.personnelName}</p>
                          <p className="text-xs text-[var(--color-text-medium)] font-mono">{req.personnelId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ${getTypeColor(req.leaveType)}`}>{req.leaveType}</span></td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--color-text-dark)]">{req.startDate}</p>
                      <p className="text-xs text-[var(--color-text-medium)]">to {req.endDate}</p>
                    </td>
                    <td className="px-4 py-3"><p className="text-sm text-[var(--color-text-medium)] max-w-xs truncate">{req.reason}</p></td>
                    <td className="px-4 py-3"><span className={`badge capitalize ${getStatusColor(req.status)}`}>{req.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleApprove(req.id)} className="px-3 py-1 badge-success rounded text-xs font-medium hover:opacity-80">Approve</button>
                          <button onClick={() => handleReject(req.id)} className="px-3 py-1 badge-error rounded text-xs font-medium hover:opacity-80">Reject</button>
                        </div>
                      ) : (
                        <button onClick={() => navigate(`/leave-requests/${req.id}`)} className="text-sm text-[var(--color-primary)] hover:underline">View</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredRequests.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredRequests.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  )
}
