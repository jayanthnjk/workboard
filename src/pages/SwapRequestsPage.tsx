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
    pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
    approved: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    rejected: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400' },
    cancelled: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400' },
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Swap Requests</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage shift swap requests</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request Swap
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }} placeholder="Search by employee or reason..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as RequestStatus); setCurrentPage(1) }} className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Requester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Acceptance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                {user?.role !== 'employee' && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {getEmployeeName(req.requesterId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{getEmployeeName(req.requesterId)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {getEmployeeName(req.targetId).split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{getEmployeeName(req.targetId)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">{req.reason}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={clsx('w-2 h-2 rounded-full', req.requesterAccepted ? 'bg-emerald-500' : 'bg-slate-300')} title="Requester" />
                      <span className={clsx('w-2 h-2 rounded-full', req.targetAccepted ? 'bg-emerald-500' : 'bg-slate-300')} title="Target" />
                      <span className="text-xs text-slate-500">{req.requesterAccepted && req.targetAccepted ? 'Both accepted' : req.targetAccepted ? 'Target accepted' : 'Awaiting target'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize', statusColors[req.status].bg, statusColors[req.status].text)}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </td>
                  {user?.role !== 'employee' && (
                    <td className="px-4 py-3">
                      {req.status === 'pending' && req.requesterAccepted && req.targetAccepted && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleApprove(req.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Approve
                          </button>
                          <button onClick={() => handleReject(req.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">
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
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No swap requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Previous</button>
              <span className="text-sm text-slate-600 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analytics.pending}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.awaitingTarget}</p>
              <p className="text-xs text-slate-500">Awaiting Target</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{analytics.awaitingSupervisor}</p>
              <p className="text-xs text-slate-500">Awaiting Approval</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{analytics.approved}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{analytics.rejected}</p>
              <p className="text-xs text-slate-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Shift Swap">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="My Shift" required>
            <select value={formData.requesterShiftId} onChange={e => setFormData({ ...formData, requesterShiftId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required>
              <option value="">Select shift</option>
              {myShifts.map(s => (<option key={s.id} value={s.id}>{s.date}</option>))}
            </select>
          </FormField>
          <FormField label="Swap With" required>
            <select value={formData.targetId} onChange={e => setFormData({ ...formData, targetId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required>
              <option value="">Select colleague</option>
              {employees.filter(e => e.id !== user?.employeeId && e.status === 'active').map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
            </select>
          </FormField>
          <FormField label="Reason" required>
            <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" rows={3} required />
          </FormField>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SwapRequestsPage
