import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Pagination } from '@/components/common/Pagination'
import { rbacService } from '@/services/rbacService'
import { personnel, leaveRequests as seedLeaveRequests } from '@/data/seedData'
import type { KPLeaveType, RequestStatus, PoliceRank } from '@/types'

const LEAVE_TYPE_META: Record<KPLeaveType, { labelKey: string; color: string; icon: string }> = {
  CL: { labelKey: 'casual_leave_full', color: '#3b82f6', icon: '📋' },
  CML: { labelKey: 'medical_leave_full', color: '#ef4444', icon: '🏥' },
  EL: { labelKey: 'earned_leave_full', color: '#10b981', icon: '🗓️' },
  PL: { labelKey: 'privilege_leave_full', color: '#8b5cf6', icon: '⭐' },
}



const STATUS_META: Record<RequestStatus, { labelKey: string; bg: string; text: string }> = {
  pending: { labelKey: 'pending', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' },
  approved: { labelKey: 'approved', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
  rejected: { labelKey: 'rejected', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
  cancelled: { labelKey: 'cancelled', bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500' },
}

interface LeaveRow {
  id: string
  personnelId: string
  personnelName: string
  personnelRank: PoliceRank
  leaveType: KPLeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: RequestStatus
  createdAt: string
}

export default function LeaveRequestsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [requests, setRequests] = useState<LeaveRow[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<KPLeaveType | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const permissions = useMemo(() => rbacService.getPermissions(user ?? null), [user])
  const viewableRanks = permissions.viewableRanks

  useEffect(() => {
    // Build leave rows from seed data, filtered by RBAC visibility
    const rows: LeaveRow[] = []

    // Use seed leave requests and map to personnel
    seedLeaveRequests.forEach((lr, i) => {
      // Map employeeId to a personnel record
      const p = personnel[i % personnel.length]
      if (!p) return
      // RBAC: only show personnel the user can see
      if (!viewableRanks.includes(p.rank)) return

      const start = new Date(lr.startDate)
      const end = new Date(lr.endDate)
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

      // Determine leave type from reason text
      let leaveType: KPLeaveType = 'EL'
      if (lr.reason.includes('CL')) leaveType = 'CL'
      else if (lr.reason.includes('PL')) leaveType = 'PL'
      else if (lr.reason.includes('Sick') || lr.reason.includes('Medical')) leaveType = 'CML'

      rows.push({
        id: lr.id,
        personnelId: p.personnelId,
        personnelName: p.name,
        personnelRank: p.rank,
        leaveType,
        startDate: lr.startDate,
        endDate: lr.endDate,
        totalDays: days,
        reason: lr.reason,
        status: lr.status as RequestStatus,
        createdAt: lr.createdAt,
      })
    })

    setRequests(rows)
    setLoading(false)
  }, [viewableRanks])

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Tab filter
      if (activeTab !== 'all' && r.status !== activeTab) return false
      if (typeFilter && r.leaveType !== typeFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!r.personnelName.toLowerCase().includes(q) && !r.personnelId.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [requests, activeTab, typeFilter, searchQuery])

  useEffect(() => { setCurrentPage(1) }, [activeTab, typeFilter, searchQuery])

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRequests.slice(start, start + pageSize)
  }, [filteredRequests, currentPage, pageSize])

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    onLeaveToday: requests.filter(r => {
      if (r.status !== 'approved') return false
      const today = new Date().toISOString().split('T')[0]
      return r.startDate <= today && r.endDate >= today
    }).length,
  }), [requests])

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' as RequestStatus } : r))
  }
  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as RequestStatus } : r))
  }

  const canApproveThis = (targetRank: PoliceRank) => {
    return permissions.canApproveLeave && rbacService.canApproveLeaveFor(permissions.userRank, targetRank)
  }

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('leave_title')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('manage_leave')}</p>
        </div>

      </div>

      {/* Tabs + Filters */}
      <div className="card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-4 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Tabs */}
          <div className="flex gap-1">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-transparent text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]'
                }`}
              >
                {tab === 'all' ? `${t('all')} (${stats.total})` : `${t(tab)} (${stats[tab]})`}
              </button>
            ))}
          </div>
          {/* Filters */}
          <div className="flex items-center gap-2 pb-3 sm:pb-0">
            <div className="flex items-center gap-2 bg-[var(--color-bg-main)] rounded-lg px-3 py-1.5 border border-[var(--color-border)]">
              <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('search_placeholder')} className="bg-transparent text-xs text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:outline-none w-32" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as KPLeaveType)} className="text-xs bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-[var(--color-text-medium)] focus:outline-none">
              <option value="">{t('all_types_leave')}</option>
              {Object.entries(LEAVE_TYPE_META).map(([k, v]) => <option key={k} value={k}>{t(v.labelKey)}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-bg-main)]">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">{t('personnel_label')}</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">{t('leave_type')}</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">{t('period')}</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">{t('days')}</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">{t('reason')}</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">{t('status')}</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {paginatedRequests.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--color-text-light)]">{t('no_leave_requests_found')}</td></tr>
              ) : (
                paginatedRequests.map(req => {
                  const meta = LEAVE_TYPE_META[req.leaveType]
                  const sMeta = STATUS_META[req.status]
                  const canApprove = canApproveThis(req.personnelRank)
                  return (
                    <tr key={req.id} className="hover:bg-[var(--color-bg-main)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--color-primary)]">
                            {req.personnelName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--color-text-dark)]">{req.personnelName}</p>
                            <p className="text-[10px] text-[var(--color-text-light)] font-mono">{req.personnelId} · {req.personnelRank}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                          <span className="text-xs text-[var(--color-text-dark)]">{t(meta.labelKey)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-[var(--color-text-dark)]">{formatDate(req.startDate)}</p>
                        <p className="text-[10px] text-[var(--color-text-light)]">to {formatDate(req.endDate)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-[var(--color-text-dark)]">{req.totalDays}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-[var(--color-text-medium)] max-w-[200px] truncate">{req.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${sMeta.bg} ${sMeta.text}`}>
                          {t(sMeta.labelKey)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === 'pending' && canApprove ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleApprove(req.id)} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              {t('approve')}
                            </button>
                            <button onClick={() => handleReject(req.id)} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              {t('reject')}
                            </button>
                          </div>
                        ) : req.status === 'pending' ? (
                          <span className="text-[10px] text-[var(--color-text-light)] italic">{t('awaiting_senior_approval')}</span>
                        ) : (
                          <span className="text-[10px] text-[var(--color-text-light)]">{req.status === 'approved' ? '✓' : '✗'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredRequests.length > 0 && (
          <div className="border-t border-[var(--color-border)]">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredRequests.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* RBAC Notice for lower ranks */}
      {!permissions.canApproveLeave && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {t('rbac_notice')}
        </div>
      )}
    </div>
  )
}
