import { useState, useEffect, useMemo } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { useAuth } from '@/context/AuthContext'
import { Modal, FormField, LoadingSpinner } from '@/components/common'
import { clsx } from 'clsx'
import type { SwapRequest, Employee, ShiftAssignment, RequestStatus } from '@/types'

const SwapRequestsPage = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState<SwapRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [myShifts, setMyShifts] = useState<ShiftAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ targetId: '', requesterShiftId: '', targetShiftId: '', reason: '' })
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => { 
    loadData() 
    
    // Refetch when page becomes visible (e.g., user navigates back from another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }
    
    // Refetch when window gains focus (user switches tabs within app)
    const handleFocus = () => {
      loadData()
    }
    
    // Listen for data changes from dataStore
    const handleDataChange = (event: CustomEvent) => {
      console.log('[SwapRequestsPage] Data changed event received:', event.detail)
      if (event.detail.type === 'swap-request') {
        loadData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('workboard-data-changed', handleDataChange as EventListener)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('workboard-data-changed', handleDataChange as EventListener)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [swapRes, empRes, shiftRes] = await Promise.all([
      apiGateway.getSwapRequests(),
      apiGateway.getAllEmployees(),
      user?.employeeId ? apiGateway.getShiftAssignmentsByEmployee(user.employeeId) : Promise.resolve({ success: true, data: [] }),
    ])
    if (swapRes.success) {
      const filtered = user?.role === 'employee'
        ? swapRes.data.filter(r => r.requesterId === user.employeeId || r.targetId === user.employeeId)
        : swapRes.data
      setRequests(filtered)
    }
    if (empRes.success) setEmployees(empRes.data)
    if (shiftRes.success) setMyShifts(shiftRes.data.filter(s => s.status === 'scheduled'))
    setLoading(false)
  }

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || id

  const statusColors: Record<RequestStatus, { bg: string; text: string }> = {
    pending: { bg: 'bg-[var(--color-warning)]/10', text: 'text-[var(--color-warning)]' },
    approved: { bg: 'bg-[var(--color-success)]/10', text: 'text-[var(--color-success)]' },
    rejected: { bg: 'bg-[var(--color-error)]/10', text: 'text-[var(--color-error)]' },
    cancelled: { bg: 'bg-[var(--color-bg-main)]', text: 'text-[var(--color-text-medium)]' },
  }

  // Filtered data
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const requesterName = getEmployeeName(r.requesterId).toLowerCase()
        const targetName = getEmployeeName(r.targetId).toLowerCase()
        if (!requesterName.includes(q) && !targetName.includes(q) && !r.reason.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [requests, statusFilter, searchQuery, employees])

  // Paginated data
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRequests.slice(start, start + pageSize)
  }, [filteredRequests, currentPage])

  const totalPages = Math.ceil(filteredRequests.length / pageSize)

  // Analytics
  const analytics = useMemo(() => {
    const total = requests.length
    const pending = requests.filter(r => r.status === 'pending').length
    const approved = requests.filter(r => r.status === 'approved').length
    const rejected = requests.filter(r => r.status === 'rejected').length
    const awaitingTarget = requests.filter(r => r.status === 'pending' && !r.targetAccepted).length
    const awaitingSupervisor = requests.filter(r => r.status === 'pending' && r.requesterAccepted && r.targetAccepted).length
    return { total, pending, approved, rejected, awaitingTarget, awaitingSupervisor }
  }, [requests])

  const handleApprove = async (id: string) => {
    await apiGateway.updateSwapRequest(id, { status: 'approved', supervisorApproved: true, approvedBy: user?.id, approvedAt: new Date().toISOString() })
    loadData()
  }

  const handleReject = async (id: string) => {
    await apiGateway.updateSwapRequest(id, { status: 'rejected', supervisorApproved: false, approvedBy: user?.id, approvedAt: new Date().toISOString() })
    loadData()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await apiGateway.createSwapRequest({
      requesterId: user?.employeeId || '',
      ...formData,
      status: 'pending',
      requesterAccepted: true,
      targetAccepted: false,
    })
    setIsModalOpen(false)
    setFormData({ targetId: '', requesterShiftId: '', targetShiftId: '', reason: '' })
    loadData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="stat-icon-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h1 className="page-title">Swap Requests</h1>
            <p className="page-subtitle">Manage shift swap requests</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request Swap
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="search-input">
              <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }} placeholder="Search by employee or reason..." className="flex-1 bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:outline-none" />
            </div>
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as RequestStatus); setCurrentPage(1) }} className="input w-auto">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-medium)]">Requester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-medium)]">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-medium)]">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-medium)]">Acceptance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-medium)]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-medium)]">Created</th>
                {user?.role !== 'employee' && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-text-medium)]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {paginatedRequests.map(req => (
                <tr key={req.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center text-[var(--color-primary)] text-xs font-bold">
                        {getEmployeeName(req.requesterId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text-dark)]">{getEmployeeName(req.requesterId)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[var(--color-secondary)]/10 rounded-lg flex items-center justify-center text-[var(--color-secondary)] text-xs font-bold">
                        {getEmployeeName(req.targetId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text-dark)]">{getEmployeeName(req.targetId)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-text-medium)] max-w-xs truncate">{req.reason}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={clsx('w-2 h-2 rounded-full', req.requesterAccepted ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]')} title="Requester" />
                      <span className={clsx('w-2 h-2 rounded-full', req.targetAccepted ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]')} title="Target" />
                      <span className="text-xs text-[var(--color-text-medium)]">{req.requesterAccepted && req.targetAccepted ? 'Both accepted' : req.targetAccepted ? 'Target accepted' : 'Awaiting target'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge capitalize', statusColors[req.status].bg, statusColors[req.status].text)}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-text-medium)]">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </td>
                  {user?.role !== 'employee' && (
                    <td className="px-4 py-3">
                      {req.status === 'pending' && req.requesterAccepted && req.targetAccepted && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleApprove(req.id)} className="badge badge-success hover:opacity-80">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Approve
                          </button>
                          <button onClick={() => handleReject(req.id)} className="badge badge-error hover:opacity-80">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {paginatedRequests.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--color-text-medium)]">No swap requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 table-header">
            <p className="text-sm text-[var(--color-text-medium)]">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn btn-ghost text-sm py-1 disabled:opacity-50">Previous</button>
              <span className="text-sm text-[var(--color-text-medium)]">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn btn-ghost text-sm py-1 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-navy">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-dark)]">{analytics.total}</p>
              <p className="text-xs text-[var(--color-text-medium)]">Total</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-warning">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-warning)]">{analytics.pending}</p>
              <p className="text-xs text-[var(--color-text-medium)]">Pending</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-info">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-info)]">{analytics.awaitingTarget}</p>
              <p className="text-xs text-[var(--color-text-medium)]">Awaiting Target</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-primary)]">{analytics.awaitingSupervisor}</p>
              <p className="text-xs text-[var(--color-text-medium)]">Awaiting Approval</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-success">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-success)]">{analytics.approved}</p>
              <p className="text-xs text-[var(--color-text-medium)]">Approved</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-error">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-error)]">{analytics.rejected}</p>
              <p className="text-xs text-[var(--color-text-medium)]">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Shift Swap">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="My Shift" required>
            <select value={formData.requesterShiftId} onChange={e => setFormData({ ...formData, requesterShiftId: e.target.value })} className="input" required>
              <option value="">Select shift</option>
              {myShifts.map(s => (<option key={s.id} value={s.id}>{s.date}</option>))}
            </select>
          </FormField>
          <FormField label="Swap With" required>
            <select value={formData.targetId} onChange={e => setFormData({ ...formData, targetId: e.target.value })} className="input" required>
              <option value="">Select colleague</option>
              {employees.filter(e => e.id !== user?.employeeId && e.status === 'active').map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
            </select>
          </FormField>
          <FormField label="Reason" required>
            <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="input" rows={3} required />
          </FormField>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SwapRequestsPage
