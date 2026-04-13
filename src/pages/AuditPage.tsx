import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Pagination } from '@/components/common/Pagination'
import { Modal } from '@/components/common/Modal'
import { auditLog, isError } from '@/services/auditLog'
import type { AuditFilters, AuditStats } from '@/services/auditLog'
import type { AuditEntry } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const ACTION_TYPES = ['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'QUERY', 'UPLOAD'] as const
const ACTION_SOURCES = ['MANUAL', 'VOICE_COMMAND', 'DOCUMENT_IMPORT', 'SYSTEM'] as const
const PAGE_SIZES = [10, 20, 50]
const DEBOUNCE_MS = 300

const ACTION_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  INSERT:  { bg: 'rgba(45, 90, 39, 0.10)',  text: 'var(--color-success)' },
  UPDATE:  { bg: 'rgba(59, 130, 246, 0.10)', text: '#3B82F6' },
  DELETE:  { bg: 'rgba(186, 26, 26, 0.08)',  text: 'var(--color-error)' },
  LOGIN:   { bg: 'rgba(0, 0, 128, 0.08)',    text: 'var(--color-primary)' },
  LOGOUT:  { bg: 'rgba(107, 92, 66, 0.10)',  text: 'var(--color-secondary)' },
  EXPORT:  { bg: 'rgba(139, 92, 246, 0.10)', text: '#8B5CF6' },
  QUERY:   { bg: 'rgba(20, 184, 166, 0.10)', text: '#14B8A6' },
  UPLOAD:  { bg: 'rgba(255, 193, 7, 0.12)',  text: '#b8860b' },
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  MANUAL:          { bg: 'rgba(0, 0, 128, 0.08)',    text: 'var(--color-primary)', icon: '👤' },
  VOICE_COMMAND:   { bg: 'rgba(139, 92, 246, 0.10)', text: '#8B5CF6',              icon: '🎙️' },
  DOCUMENT_IMPORT: { bg: 'rgba(255, 193, 7, 0.12)',  text: '#b8860b',              icon: '📄' },
  SYSTEM:          { bg: 'rgba(107, 92, 66, 0.10)',  text: 'var(--color-secondary)', icon: '⚙️' },
}

const RESULT_COLORS: Record<string, { bg: string; text: string }> = {
  SUCCESS:   { bg: 'rgba(45, 90, 39, 0.10)',  text: 'var(--color-success)' },
  DENIED:    { bg: 'rgba(186, 26, 26, 0.08)', text: 'var(--color-error)' },
  FAILED:    { bg: 'rgba(186, 26, 26, 0.08)', text: 'var(--color-error)' },
  CANCELLED: { bg: 'rgba(107, 92, 66, 0.10)', text: 'var(--color-secondary)' },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatActionVerb(actionType: string): string {
  const verbs: Record<string, string> = {
    INSERT: 'Created', UPDATE: 'Updated', DELETE: 'Deleted',
    LOGIN: 'Logged in', LOGOUT: 'Logged out', EXPORT: 'Exported',
    QUERY: 'Queried', UPLOAD: 'Uploaded',
  }
  return verbs[actionType] || actionType
}

function formatDescription(entry: AuditEntry): string {
  const verb = formatActionVerb(entry.actionType)
  if (entry.targetTable) {
    const table = entry.targetTable.replace(/_/g, ' ')
    if (entry.targetRecordId) return `${verb} ${table} #${entry.targetRecordId}`
    return `${verb} ${table}`
  }
  if (entry.actionType === 'LOGIN') return 'User logged in'
  if (entry.actionType === 'LOGOUT') return 'User logged out'
  return verb
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return ts }
}

function tryParseJson(val: string | null): Record<string, unknown> | null {
  if (!val) return null
  try { return JSON.parse(val) } catch { return null }
}

function formatSourceLabel(source: string): string {
  return source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const { t } = useLanguage()

  // Data state
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [stats, setStats] = useState<AuditStats | null>(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)

  // Filter state
  const [actionType, setActionType] = useState('')
  const [source, setSource] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchText, setSearchText] = useState('')

  // Pagination state (0-indexed for backend)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const buildFilters = useCallback((): AuditFilters => {
    const f: AuditFilters = { page, size: pageSize }
    if (actionType) f.actionType = actionType
    if (source) f.source = source
    if (dateFrom) f.from = `${dateFrom}T00:00:00`
    if (dateTo) f.to = `${dateTo}T23:59:59`
    if (searchText.trim()) f.search = searchText.trim()
    return f
  }, [actionType, source, dateFrom, dateTo, searchText, page, pageSize])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await auditLog.getEntries(buildFilters())
    if (isError(result)) {
      setError(result.message)
      setEntries([])
      setTotalElements(0)
      setTotalPages(0)
    } else {
      setEntries(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
    }
    setLoading(false)
  }, [buildFilters])

  const fetchStats = useCallback(async () => {
    const result = await auditLog.getStats(
      dateFrom ? `${dateFrom}T00:00:00` : undefined,
      dateTo ? `${dateTo}T23:59:59` : undefined,
    )
    if (!isError(result)) setStats(result)
  }, [dateFrom, dateTo])

  // Initial load
  useEffect(() => {
    fetchEntries()
    fetchStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch on page/pageSize change (immediate)
  useEffect(() => {
    fetchEntries()
  }, [page, pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced re-fetch on filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(0) // reset to first page on filter change
      fetchEntries()
      fetchStats()
    }, DEBOUNCE_MS)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [actionType, source, dateFrom, dateTo, searchText]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Export handler ─────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true)
    const f: Omit<AuditFilters, 'page' | 'size'> = {}
    if (actionType) f.actionType = actionType
    if (source) f.source = source
    if (dateFrom) f.from = `${dateFrom}T00:00:00`
    if (dateTo) f.to = `${dateTo}T23:59:59`
    if (searchText.trim()) f.search = searchText.trim()
    await auditLog.exportCsv(f)
    setExporting(false)
  }

  // ── Stat helpers ───────────────────────────────────────────────────────────

  const statCards = [
    {
      label: t('total_entries'),
      value: stats?.totalCount ?? 0,
      iconClass: 'stat-icon-info',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Inserts',
      value: stats?.countByActionType?.INSERT ?? 0,
      iconClass: 'stat-icon-success',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: t('updates'),
      value: stats?.countByActionType?.UPDATE ?? 0,
      iconClass: 'stat-icon-warning',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: t('deletes'),
      value: stats?.countByActionType?.DELETE ?? 0,
      iconClass: 'stat-icon-error',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    {
      label: 'Logins',
      value: stats?.countByActionType?.LOGIN ?? 0,
      iconClass: 'stat-icon-primary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      label: 'Exports',
      value: stats?.countByActionType?.EXPORT ?? 0,
      iconClass: 'stat-icon-secondary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
  ]

  // ── Error / Loading states ─────────────────────────────────────────────────

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-full bg-[rgba(186,26,26,0.08)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-[var(--color-text-medium)] text-sm">{error}</p>
        <button onClick={() => { fetchEntries(); fetchStats() }} className="btn btn-primary text-sm">
          Retry
        </button>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('audit_title')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('audit_subtitle')}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn btn-primary"
        >
          {exporting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          {t('export_log')}
        </button>
      </div>

      {/* Error banner (non-blocking) */}
      {error && entries.length > 0 && (
        <div className="card p-3 flex items-center gap-3 border-l-4" style={{ borderLeftColor: 'var(--color-error)' }}>
          <svg className="w-5 h-5 text-[var(--color-error)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
          <span className="text-sm text-[var(--color-text-medium)] flex-1">{error}</span>
          <button onClick={() => { fetchEntries(); fetchStats() }} className="text-xs font-medium text-[var(--color-primary)] hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex items-center gap-3">
              <div className={stat.iconClass}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-dark)]">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-[var(--color-text-medium)]">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">{t('search')}</label>
            <div className="search-input">
              <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder={t('user_or_entity')}
                className="flex-1 bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:outline-none"
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">{t('action_type')}</label>
            <select value={actionType} onChange={e => setActionType(e.target.value)} className="input">
              <option value="">{t('all_actions')}</option>
              {ACTION_TYPES.map(at => (
                <option key={at} value={at}>{at}</option>
              ))}
            </select>
          </div>

          {/* Action Source */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">Source</label>
            <select value={source} onChange={e => setSource(e.target.value)} className="input">
              <option value="">All Sources</option>
              {ACTION_SOURCES.map(s => (
                <option key={s} value={s}>{formatSourceLabel(s)}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">{t('from')}</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-medium)] mb-1">{t('to')}</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading && (
          <div className="flex items-center justify-center py-4 border-b border-[var(--color-border)]">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-xs text-[var(--color-text-light)]">{t('loading')}</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('timestamp')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('user')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('action_type')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('details')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {entries.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm text-[var(--color-text-medium)]">{t('no_audit_entries_found')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr
                    key={entry.id}
                    className="table-row cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <td className="px-4 py-3 text-sm text-[var(--color-text-medium)] whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-xs font-semibold text-[var(--color-primary)]">
                          {entry.userId ? `U${entry.userId}` : '?'}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[var(--color-text-dark)]">
                            {entry.userRole || `User #${entry.userId || '—'}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="badge text-xs font-semibold"
                        style={{
                          background: ACTION_TYPE_COLORS[entry.actionType]?.bg || 'rgba(0,0,0,0.05)',
                          color: ACTION_TYPE_COLORS[entry.actionType]?.text || 'inherit',
                        }}
                      >
                        {entry.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="badge text-xs font-semibold inline-flex items-center gap-1"
                        style={{
                          background: SOURCE_COLORS[entry.source]?.bg || 'rgba(0,0,0,0.05)',
                          color: SOURCE_COLORS[entry.source]?.text || 'inherit',
                        }}
                      >
                        <span>{SOURCE_COLORS[entry.source]?.icon || '•'}</span>
                        {formatSourceLabel(entry.source)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-dark)] max-w-xs truncate">
                      {formatDescription(entry)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="badge text-xs font-semibold"
                        style={{
                          background: RESULT_COLORS[entry.result]?.bg || 'rgba(0,0,0,0.05)',
                          color: RESULT_COLORS[entry.result]?.text || 'inherit',
                        }}
                      >
                        {entry.result}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalElements > 0 && (
          <Pagination
            currentPage={page + 1}
            totalItems={totalElements}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p - 1)}
            onPageSizeChange={(size) => { setPageSize(size); setPage(0) }}
            pageSizeOptions={PAGE_SIZES}
          />
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={t('audit_entry_details')}
        size="xl"
      >
        {selectedEntry && <AuditDetailContent entry={selectedEntry} />}
      </Modal>
    </div>
  )
}

// ── Detail Modal Content ───────────────────────────────────────────────────────

function AuditDetailContent({ entry }: { entry: AuditEntry }) {
  const oldVals = tryParseJson(entry.oldValues)
  const newVals = tryParseJson(entry.newValues)

  // Compute changed keys for diff
  const allKeys = new Set([
    ...Object.keys(oldVals || {}),
    ...Object.keys(newVals || {}),
  ])

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
      {/* Description */}
      <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
        <p className="text-sm font-medium text-[var(--color-text-dark)]">
          {formatDescription(entry)}
        </p>
        <p className="text-xs text-[var(--color-text-light)] mt-1">
          {formatTimestamp(entry.timestamp)}
        </p>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        <span
          className="badge text-xs font-semibold"
          style={{
            background: ACTION_TYPE_COLORS[entry.actionType]?.bg,
            color: ACTION_TYPE_COLORS[entry.actionType]?.text,
          }}
        >
          {entry.actionType}
        </span>
        <span
          className="badge text-xs font-semibold inline-flex items-center gap-1"
          style={{
            background: SOURCE_COLORS[entry.source]?.bg,
            color: SOURCE_COLORS[entry.source]?.text,
          }}
        >
          <span>{SOURCE_COLORS[entry.source]?.icon}</span>
          {formatSourceLabel(entry.source)}
        </span>
        <span
          className="badge text-xs font-semibold"
          style={{
            background: RESULT_COLORS[entry.result]?.bg,
            color: RESULT_COLORS[entry.result]?.text,
          }}
        >
          {entry.result}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <DetailRow label="User ID" value={entry.userId != null ? String(entry.userId) : '—'} />
        <DetailRow label="User Role" value={entry.userRole || '—'} />
        <DetailRow label="Target Table" value={entry.targetTable || '—'} />
        <DetailRow label="Record ID" value={entry.targetRecordId != null ? String(entry.targetRecordId) : '—'} />
        <DetailRow label="IP Address" value={entry.ipAddress || '—'} />
        <DetailRow label="User Agent" value={entry.userAgent || '—'} />
      </div>

      {/* Voice transcript */}
      {entry.voiceTranscript && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-medium)] uppercase mb-2">Voice Transcript</h4>
          <div className="p-3 rounded-lg text-sm text-[var(--color-text-dark)]" style={{ background: 'rgba(139, 92, 246, 0.06)' }}>
            <span className="mr-1">🎙️</span> {entry.voiceTranscript}
            {entry.detectedIntent && (
              <span className="ml-2 badge badge-info text-xs">Intent: {entry.detectedIntent}</span>
            )}
          </div>
        </div>
      )}

      {/* Document filename */}
      {entry.documentFilename && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-medium)] uppercase mb-2">Document</h4>
          <div className="p-3 rounded-lg text-sm text-[var(--color-text-dark)] inline-flex items-center gap-2" style={{ background: 'rgba(255, 193, 7, 0.08)' }}>
            <span>📄</span> {entry.documentFilename}
          </div>
        </div>
      )}

      {/* Denial reason */}
      {entry.denialReason && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-medium)] uppercase mb-2">Denial Reason</h4>
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(186, 26, 26, 0.06)', color: 'var(--color-error)' }}>
            {entry.denialReason}
          </div>
        </div>
      )}

      {/* Old / New values diff */}
      {(oldVals || newVals) && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-medium)] uppercase mb-2">Changes</h4>
          <div className="rounded-lg overflow-hidden border border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                  <th className="px-3 py-2 text-left font-medium text-[var(--color-text-medium)]">Field</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--color-text-medium)]">Before</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--color-text-medium)]">After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {Array.from(allKeys).map(key => {
                  const oldVal = oldVals?.[key]
                  const newVal = newVals?.[key]
                  const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal)
                  return (
                    <tr key={key} style={changed ? { background: 'rgba(59, 130, 246, 0.04)' } : undefined}>
                      <td className="px-3 py-2 font-medium text-[var(--color-text-dark)]">{key}</td>
                      <td className="px-3 py-2 text-[var(--color-text-medium)]">
                        {oldVal !== undefined ? (
                          <span style={changed ? { color: 'var(--color-error)', textDecoration: 'line-through' } : undefined}>
                            {typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 text-[var(--color-text-medium)]">
                        {newVal !== undefined ? (
                          <span style={changed ? { color: 'var(--color-success)', fontWeight: 600 } : undefined}>
                            {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 border-b border-[var(--color-border)]">
      <span className="text-xs text-[var(--color-text-light)] block">{label}</span>
      <span className="text-sm text-[var(--color-text-dark)] break-all">{value}</span>
    </div>
  )
}
