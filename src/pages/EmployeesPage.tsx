import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { apiGateway } from '@/services/apiGateway'
import { rbacService, type UserPermissions } from '@/services/rbacService'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Pagination } from '@/components/common/Pagination'
import type { Personnel, SectionType, PoliceRank, PersonnelStatus } from '@/types'

const RANKS: PoliceRank[] = ['DCP', 'ACP', 'RPI', 'RSI', 'ARSI', 'AHC', 'APC']
const SECTIONS: SectionType[] = ['A', 'B', 'C', 'PMT', 'RECRUIT']
const STATUSES: PersonnelStatus[] = ['active', 'on-leave', 'absent', 'suspended', 'sick', 'training']

export default function EmployeesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionFilter, setSectionFilter] = useState<SectionType | 'all'>((searchParams.get('section') as SectionType) || 'all')
  const [searchTerm, setSearchTerm] = useState('')
  const [rankFilter, setRankFilter] = useState<PoliceRank | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<PersonnelStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const permissions: UserPermissions = useMemo(() => rbacService.getPermissions(user), [user])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = sectionFilter === 'all' ? await apiGateway.getAllPersonnel() : await apiGateway.getPersonnelBySection(sectionFilter)
        if (response.success) setPersonnel(response.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [sectionFilter, location.key])

  const filteredPersonnel = useMemo(() => {
    return personnel.filter(p => {
      const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.personnelId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRank = rankFilter === 'all' || p.rank === rankFilter
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesRank && matchesStatus
    })
  }, [personnel, searchTerm, rankFilter, statusFilter])

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1) }, [searchTerm, rankFilter, statusFilter, sectionFilter])

  const paginatedPersonnel = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredPersonnel.slice(start, start + pageSize)
  }, [filteredPersonnel, currentPage, pageSize])

  const stats = useMemo(() => [
    { label: t('total_personnel'), value: personnel.length, color: 'bg-[var(--color-info)]/10', icon: '👥' },
    { label: t('active'), value: personnel.filter(p => p.status === 'active').length, color: 'bg-[var(--color-success)]/10', icon: '✓' },
    { label: t('on_leave'), value: personnel.filter(p => p.status === 'on-leave').length, color: 'bg-[var(--color-warning)]/10', icon: '📋' },
    { label: 'Suspended', value: personnel.filter(p => p.status === 'suspended').length, color: 'bg-[var(--color-error)]/10', icon: '⛔' },
    { label: t('training'), value: personnel.filter(p => p.status === 'training').length, color: 'bg-[var(--color-accent-indigo)]/10', icon: '📚' },
  ], [personnel, t])

  const getRankColor = (rank: PoliceRank): string => {
    const colors: Record<PoliceRank, string> = {
      DCP: 'bg-[var(--color-error)]/10 text-[var(--color-error)]', 
      ACP: 'bg-[var(--color-accent-indigo)]/10 text-[var(--color-accent-indigo)]', 
      RPI: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
      RSI: 'bg-[var(--color-accent-teal)]/10 text-[var(--color-accent-teal)]', 
      ARSI: 'bg-[var(--color-success)]/10 text-[var(--color-success)]', 
      AHC: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]', 
      APC: 'bg-[var(--color-bg-main)] text-[var(--color-text-medium)]',
    }
    return colors[rank]
  }

  const getStatusColor = (status: PersonnelStatus): string => {
    const colors: Record<PersonnelStatus, string> = {
      active: 'bg-[var(--color-success)]/10 text-[var(--color-success)]', 
      'on-leave': 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]', 
      absent: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
      suspended: 'bg-[var(--color-error)]/10 text-[var(--color-error)]', 
      sick: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]', 
      training: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
    }
    return colors[status]
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('personnel')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('manage_team')}</p>
        </div>
        {permissions.canAddPersonnel && (
          <button onClick={() => navigate('/employees/add')} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            {t('add_personnel')}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-lg`}>{stat.icon}</div>
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
          {/* Search */}
          <div className="flex-1">
            <div className="search-input">
              <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder={t('search_name_id')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:outline-none" />
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2">
            {(['all', ...SECTIONS] as const).map(section => (
              <button key={section} onClick={() => setSectionFilter(section)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sectionFilter === section ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-main)] text-[var(--color-text-medium)] hover:bg-[var(--color-border)]'}`}>
                {section === 'all' ? t('all_label') : section}
              </button>
            ))}
          </div>

          {/* Dropdowns */}
          <div className="flex gap-2">
            <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value as PoliceRank | 'all')} className="input py-2 text-sm">
              <option value="all">{t('all_ranks_label')}</option>
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PersonnelStatus | 'all')} className="input py-2 text-sm">
              <option value="all">{t('all_status_label')}</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('id')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('rank')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('section')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Duty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('platoon')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-medium)] uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredPersonnel.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--color-text-medium)]">{t('no_personnel_found')}</td></tr>
              ) : (
                paginatedPersonnel.map(person => (
                  <tr key={person.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-xs font-semibold text-[var(--color-secondary)]">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-dark)]">{person.name}</p>
                          {person.dutyCategory && <p className="text-xs text-[var(--color-text-medium)] capitalize">{person.dutyCategory.replace(/-/g, ' ')}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-medium)] font-mono">{person.personnelId}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${getRankColor(person.rank)}`}>{person.rank}</span></td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-medium)]">{person.section}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-medium)]">{person.dutyCategory || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-medium)]">{person.platoon || '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(person.status)}`}>{person.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => navigate(`/employees/${person.id}`)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#000080] bg-[rgba(0,0,128,0.05)] hover:bg-[rgba(0,0,128,0.1)] transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {t('view')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredPersonnel.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPersonnel.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  )
}
