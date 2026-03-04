import { useState, useEffect, useMemo } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { useAuth } from '@/context/AuthContext'
import { Modal, FormField, LoadingSpinner } from '@/components/common'
import { clsx } from 'clsx'
import type { LeaveRequest, Employee, LeaveType, RequestStatus } from '@/types'

const LeaveRequestsPage = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: 'annual' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  })
  const [leaveBalances, setLeaveBalances] = useState<{ type: string; remaining: number }[]>([])
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<LeaveType | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
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
      console.log('[LeaveRequestsPage] Data changed event received:', event.detail)
      if (event.detail.type === 'leave-request') {
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
    const [reqRes, empRes] = await Promise.all([
      apiGateway.getLeaveRequests(),
      apiGateway.getAllEmployees(),
    ])
    if (reqRes.success) {
      const filtered = user?.role === 'employee' 
        ? reqRes.data.filter(r => r.employeeId === user.employeeId)
        : reqRes.data
      setRequests(filtered)
    }
    if (empRes.success) setEmployees(empRes.data)
    if (user?.employeeId) {
      const balRes = await apiGateway.getLeaveBalances(user.employeeId)
      if (balRes.success) setLeaveBalances(balRes.data)
    }
    setLoading(false)
  }

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || id

  const statusColors: Record<RequestStatus, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
    approved: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    rejected: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400' },
    cancelled: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400' },
  }

  const typeColors: Record<LeaveType, { bg: string; text: string }> = {
    annual: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
    sick: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400' },
    personal: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
    unpaid: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400' },
    maternity: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
    paternity: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
  }

  // Filtered data
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false
      if (typeFilter && r.leaveType !== typeFilter) return false
      if (dateFrom && r.startDate < dateFrom) return false
      if (dateTo && r.endDate > dateTo) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const empName = getEmployeeName(r.employeeId).toLowerCase()
        if (!empName.includes(q) && !r.reason.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [requests, statusFilter, typeFilter, dateFrom, dateTo, searchQuery, employees])

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
    const byType = {
      annual: requests.filter(r => r.leaveType === 'annual').length,
      sick: requests.filter(r => r.leaveType === 'sick').length,
      personal: requests.filter(r => r.leaveType === 'personal').length,
      unpaid: requests.filter(r => r.leaveType === 'unpaid').length,
      maternity: requests.filter(r => r.leaveType === 'maternity').length,
      paternity: requests.filter(r => r.leaveType === 'paternity').length,
    }
    return { total, pending, approved, rejected, byType }
  }, [requests])

  const handleApprove = async (id: string) => {
    await apiGateway.updateLeaveRequest(id, { status: 'approved', approvedBy: user?.id, approvedAt: new Date().toISOString() })
    loadData()
  }

  const handleReject = async (id: string) => {
    await apiGateway.updateLeaveRequest(id, { status: 'rejected', approvedBy: user?.id, approvedAt: new Date().toISOString() })
    loadData()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await apiGateway.createLeaveRequest({
      employeeId: user?.employeeId || '',
      ...formData,
      status: 'pending',
      affectedShifts: [],
    })
    setIsModalOpen(false)
    setFormData({ leaveType: 'annual', startDate: '', endDate: '', reason: '' })
    loadData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Leave Requests</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage time off requests</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request Leave
        </button>
      </div>

      {/* Leave Balances (for employees) */}
      {user?.role === 'employee' && leaveBalances.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {leaveBalances.map(b => (
            <div key={b.type} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 capitalize">{b.type} Leave</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{b.remaining} <span className="text-sm font-normal text-slate-400">days</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }} placeholder="Search by employee or reason..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as RequestStatus); setCurrentPage(1) }} className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as LeaveType); setCurrentPage(1) }} className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500">
            <option value="">All Types</option>
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="personal">Personal</option>
            <option value="unpaid">Unpaid</option>
            <option value="maternity">Maternity</option>
            <option value="paternity">Paternity</option>
          </select>
          <div className="flex gap-2">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1) }} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500" placeholder="From" />
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setCurrentPage(1) }} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500" placeholder="To" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                {user?.role !== 'employee' && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{getEmployeeName(req.employeeId)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize', typeColors[req.leaveType].bg, typeColors[req.leaveType].text)}>
                      {req.leaveType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{req.startDate} → {req.endDate}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">{req.reason}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize', statusColors[req.status].bg, statusColors[req.status].text)}>
                      {req.status}
                    </span>
                  </td>
                  {user?.role !== 'employee' && (
                    <td className="px-4 py-3">
                      {req.status === 'pending' && (
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
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No leave requests found</td></tr>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.total}</p>
              <p className="text-xs text-slate-500">Total Requests</p>
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

      {/* Leave Type Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Leave Type Distribution</h3>
        <div className="flex items-center justify-center gap-12">
          {/* Donut Chart */}
          <div className="relative w-56 h-56 flex-shrink-0">
            <svg className="w-56 h-56" viewBox="0 0 100 100">
              {(() => {
                const data = Object.entries(analytics.byType).filter(([_, count]) => count > 0)
                const total = data.reduce((sum, [_, count]) => sum + count, 0) || 1
                const colors: Record<string, string> = {
                  annual: '#6366f1',
                  sick: '#ef4444',
                  personal: '#a855f7',
                  unpaid: '#64748b',
                  maternity: '#ec4899',
                  paternity: '#06b6d4',
                }
                const circumference = 2 * Math.PI * 40
                let offset = 0
                
                if (data.length === 0) {
                  return <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                }
                
                return data.map(([type, count]) => {
                  const percentage = (count / total) * 100
                  const dashArray = `${(percentage / 100) * circumference} ${circumference}`
                  const dashOffset = -(offset / 100) * circumference
                  offset += percentage
                  return (
                    <circle 
                      key={type} 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke={colors[type] || '#6366f1'} 
                      strokeWidth="12" 
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 50 50)"
                    />
                  )
                })
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{analytics.total}</p>
              </div>
            </div>
          </div>
          
          {/* Legend - Vertical list on right */}
          <div className="flex flex-col gap-3">
            {Object.entries(analytics.byType).map(([type, count]) => {
              const colors: Record<string, string> = {
                annual: '#6366f1',
                sick: '#ef4444',
                personal: '#a855f7',
                unpaid: '#64748b',
                maternity: '#ec4899',
                paternity: '#06b6d4',
              }
              return (
                <div key={type} className="flex items-center gap-3 min-w-[160px]">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[type] }} />
                  <span className="text-sm text-slate-600 dark:text-slate-400 capitalize flex-1">{type}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Leave Type" required>
            <select value={formData.leaveType} onChange={e => setFormData({ ...formData, leaveType: e.target.value as LeaveType })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="unpaid">Unpaid</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" required>
              <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required />
            </FormField>
            <FormField label="End Date" required>
              <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required />
            </FormField>
          </div>
          <FormField label="Reason" required>
            <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" rows={3} required />
          </FormField>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default LeaveRequestsPage
