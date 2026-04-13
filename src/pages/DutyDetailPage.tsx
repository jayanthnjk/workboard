import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGateway } from '@/services/apiGateway'
import { rotationService } from '@/services/rotationService'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Pagination } from '@/components/common/Pagination'
import { guardLocations, platoonLocationAssignments } from '@/data/seedData'
import type { PlatoonId, RotationalDutyType, Personnel, GuardLocation } from '@/types'

const LocationMap = lazy(() => import('@/components/common/LocationMap'))

const DUTY_LABELS: Record<RotationalDutyType, string> = {
  'guard-i': 'Guard-I',
  'guard-ii': 'Guard-II',
  'check-point': 'Check Point',
  'prison-vip-escort': 'Prison/VIP Escort',
  'striking-force': 'Striking Force',
}

const DUTY_COLORS: Record<RotationalDutyType, string> = {
  'guard-i': 'var(--color-success)',
  'guard-ii': 'var(--color-info)',
  'check-point': 'var(--color-warning)',
  'prison-vip-escort': 'var(--color-accent-purple)',
  'striking-force': 'var(--color-error)',
}

export default function DutyDetailPage({ embedded, platoonOverride }: { embedded?: boolean; platoonOverride?: string } = {}) {
  const { platoonId } = useParams<{ platoonId: string }>()
  const navigate = useNavigate()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([])
  const [addSearch, setAddSearch] = useState('')
  const [additionalPersonnel, setAdditionalPersonnel] = useState<Personnel[]>([])
  const [selectedMapLocation, setSelectedMapLocation] = useState<GuardLocation | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRank, setFilterRank] = useState('')
  const [filterLocation, setFilterLocation] = useState('')


  const pid = (platoonOverride || platoonId || 'P1') as PlatoonId
  const cycleNumber = useMemo(() => rotationService.getCycleNumber(new Date()), [])
  const dutyType = useMemo(() => rotationService.getDutyTypeForPlatoon(pid, cycleNumber), [pid, cycleNumber])
  const cycleDateRange = useMemo(() => rotationService.getCycleDateRange(cycleNumber), [cycleNumber])
  const dutyColor = DUTY_COLORS[dutyType]

  // Show only locations assigned to this platoon
  const dutyLocations = useMemo(() => {
    const assignedIds = new Set(platoonLocationAssignments[pid] || [])
    return guardLocations.filter(l => l.isActive && assignedIds.has(l.id))
  }, [pid])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perRes, allRes] = await Promise.all([
          apiGateway.getPersonnelByPlatoon(pid),
          apiGateway.getAllPersonnel(),
        ])
        if (perRes.success) setPersonnel(perRes.data.filter(p => p.status === 'active'))
        if (allRes.success) setAllPersonnel(allRes.data.filter(p => p.status === 'active'))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [pid])

  const availableForAdd = useMemo(() => {
    const currentIds = new Set([...personnel.map(p => p.id), ...additionalPersonnel.map(p => p.id)])
    let filtered = allPersonnel.filter(p => !currentIds.has(p.id))
    if (addSearch) {
      const q = addSearch.toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.personnelId.toLowerCase().includes(q))
    }
    return filtered.slice(0, 20)
  }, [allPersonnel, personnel, additionalPersonnel, addSearch])

  const allOnDuty = [...personnel, ...additionalPersonnel]

  // Map each personnel to an assigned location (distribute by requiredPersonnel)
  const personnelLocationMap = useMemo(() => {
    const map = new Map<string, string>()
    if (dutyLocations.length === 0) return map
    let locIndex = 0
    let filled = 0
    for (const p of allOnDuty) {
      const loc = dutyLocations[locIndex]
      map.set(p.id, loc.code)
      filled++
      if (filled >= loc.requiredPersonnel && locIndex < dutyLocations.length - 1) {
        locIndex++
        filled = 0
      }
    }
    return map
  }, [allOnDuty, dutyLocations])

  // Available ranks for filter dropdown
  const availableRanks = useMemo(() => {
    const ranks = new Set(allOnDuty.map(p => p.rank))
    return Array.from(ranks).sort()
  }, [allOnDuty])

  // Available location codes for filter dropdown
  const availableLocationCodes = useMemo(() => {
    return dutyLocations.map(l => l.code)
  }, [dutyLocations])

  // Apply filters
  const filteredOnDuty = useMemo(() => {
    let result = allOnDuty
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.personnelId.toLowerCase().includes(q))
    }
    if (filterRank) {
      result = result.filter(p => p.rank === filterRank)
    }
    if (filterLocation) {
      result = result.filter(p => personnelLocationMap.get(p.id) === filterLocation)
    }
    return result
  }, [allOnDuty, searchQuery, filterRank, filterLocation, personnelLocationMap])

  const hasActiveFilters = !!(searchQuery || filterRank || filterLocation)

  // Filtered locations for map — show only locations that have filtered personnel
  const filteredLocations = useMemo(() => {
    if (!hasActiveFilters) return dutyLocations
    const activeCodes = new Set(filteredOnDuty.map(p => personnelLocationMap.get(p.id)).filter(Boolean))
    return dutyLocations.filter(l => activeCodes.has(l.code))
  }, [dutyLocations, filteredOnDuty, personnelLocationMap, hasActiveFilters])

  // Grouped locations based on filtered locations
  const groupedLocations = useMemo(() => {
    const typeConfig: Record<string, { label: string; icon: string }> = {
      'government-office': { label: 'Government Office', icon: '🏛️' },
      'bank-currency-chest': { label: 'Bank Currency Chest', icon: '🏦' },
      'court': { label: 'Court', icon: '⚖️' },
      'hospital': { label: 'Hospital', icon: '🏥' },
      'ncc': { label: 'NCC', icon: '🎖️' },
    }
    const groups: { label: string; icon: string; locs: typeof dutyLocations }[] = []
    const groupMap = new Map<string, typeof dutyLocations>()
    for (const loc of filteredLocations) {
      if (!groupMap.has(loc.type)) groupMap.set(loc.type, [])
      groupMap.get(loc.type)!.push(loc)
    }
    for (const [type, locs] of groupMap) {
      const cfg = typeConfig[type] || { label: type, icon: '📍' }
      groups.push({ ...cfg, locs })
    }
    return groups
  }, [filteredLocations])

  const paginatedOnDuty = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOnDuty.slice(start, start + pageSize)
  }, [filteredOnDuty, currentPage, pageSize])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterRank, filterLocation])

  // When filtering to a single location, auto-highlight it on map
  useEffect(() => {
    if (filterLocation) {
      const loc = dutyLocations.find(l => l.code === filterLocation)
      if (loc) setSelectedMapLocation(loc)
    }
  }, [filterLocation, dutyLocations])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      {!embedded && (
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-bg-card)] rounded-lg text-[var(--color-text-medium)] flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="page-title">Platoon {pid.replace('P', '')} — Duty Detail</h1>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `color-mix(in srgb, ${dutyColor} 15%, transparent)`, color: dutyColor }}>
              {DUTY_LABELS[dutyType]}
            </span>
          </div>
          <p className="page-subtitle">
            Cycle {cycleNumber} · {new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary text-xs sm:text-sm whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span className="hidden sm:inline">Add Resource</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
      )}

      {/* Stats row */}
      {!embedded && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-dark)]">{filteredOnDuty.length}</p>
              <p className="text-xs text-[var(--color-text-medium)]">{hasActiveFilters ? 'Filtered' : 'On Duty'}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-success">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-dark)]">{personnel.length}</p>
              <p className="text-xs text-[var(--color-text-medium)]">Regular</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-orange">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-dark)]">{additionalPersonnel.length}</p>
              <p className="text-xs text-[var(--color-text-medium)]">Additional</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon-info">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-dark)]">{filteredLocations.length}</p>
              <p className="text-xs text-[var(--color-text-medium)]">Locations</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Filters */}
      <div className="card px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search — takes remaining space */}
          <div className="flex items-center gap-2 bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
            <svg className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] outline-none flex-1"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Rank filter */}
          <select value={filterRank} onChange={e => setFilterRank(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-dark)] outline-none focus:border-[var(--color-primary)]">
            <option value="">All Ranks</option>
            {availableRanks.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Location filter */}
          <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-dark)] outline-none focus:border-[var(--color-primary)]">
            <option value="">All Locations</option>
            {availableLocationCodes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>



          {/* Clear filters */}
          {hasActiveFilters && (
            <button onClick={() => { setSearchQuery(''); setFilterRank(''); setFilterLocation(''); setSelectedMapLocation(null) }}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main content: Map + Location details + Personnel list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Map + Location details column */}
        {dutyLocations.length > 0 && (
          <div className="lg:col-span-1 flex flex-col gap-4 lg:sticky lg:top-4">
            {/* Map */}
            <div className="card overflow-hidden flex flex-col" style={{ height: '300px' }}>
              <div className="px-4 py-3 border-b border-[var(--color-border)]">
                <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">Guard Locations</h3>
              </div>
              <div className="flex-1 min-h-0">
                <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
                  <LocationMap
                    locations={filteredLocations}
                    onSelectLocation={loc => setSelectedMapLocation(loc)}
                    selectedLocationId={selectedMapLocation?.id}
                  />
                </Suspense>
              </div>
            </div>

            {/* Location details grouped by type */}
            <div className="card overflow-hidden flex flex-col" style={{ maxHeight: '350px' }}>
              <div className="px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
                <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">Assigned Locations</h3>
                <p className="text-[10px] text-[var(--color-text-light)] mt-0.5">{filteredLocations.length} locations · {filteredLocations.reduce((sum, l) => sum + l.requiredPersonnel, 0)} personnel required</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                {groupedLocations.map((group, gi) => {
                  const isOpen = expandedGroup === group.label
                  return (
                    <div key={group.label} className={gi > 0 ? 'border-t border-[var(--color-border)]' : ''}>
                      <button
                        onClick={() => setExpandedGroup(isOpen ? null : group.label)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--color-bg-main)]/50 transition-colors"
                      >
                        <svg className={`w-3.5 h-3.5 text-[var(--color-text-light)] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        <span className="text-sm">{group.icon}</span>
                        <span className="text-[11px] font-semibold text-[var(--color-text-dark)] uppercase tracking-wider flex-1 text-left">{group.label}</span>
                        <span className="text-[10px] font-medium text-[var(--color-text-light)] bg-[var(--color-bg-main)] px-1.5 py-0.5 rounded-full">{group.locs.length}</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 space-y-1.5">
                          {group.locs.map(loc => (
                            <button
                              key={loc.id}
                              onClick={() => setSelectedMapLocation(loc)}
                              className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-xs group ${
                                selectedMapLocation?.id === loc.id
                                  ? 'bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/30'
                                  : 'hover:bg-[var(--color-bg-main)]'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                selectedMapLocation?.id === loc.id ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-light)]'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${
                                  selectedMapLocation?.id === loc.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dark)]'
                                }`}>{loc.name}</p>
                                <p className="text-[10px] text-[var(--color-text-light)] font-mono">{loc.code} · {loc.requiredPersonnel} personnel</p>
                              </div>
                              <svg className="w-3.5 h-3.5 text-[var(--color-text-light)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Personnel list */}
        <div className={`${dutyLocations.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="table-container">
            <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">Personnel on Duty</h3>
              <span className="text-xs text-[var(--color-text-light)]">{filteredOnDuty.length}{hasActiveFilters ? ` of ${allOnDuty.length}` : ''} people</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {paginatedOnDuty.map(p => {
                    const isAdditional = additionalPersonnel.some(ap => ap.id === p.id)
                    return (
                      <tr key={p.id} className="table-row">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-[10px] font-semibold text-[var(--color-secondary)]">
                              {p.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-[var(--color-text-dark)]">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-medium)] font-mono">{p.personnelId}</td>
                        <td className="px-4 py-3"><span className="badge badge-primary">{p.rank}</span></td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-[var(--color-text-medium)]">{personnelLocationMap.get(p.id) || '—'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredOnDuty.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">Add Additional Resource</h3>
                <button onClick={() => setShowAddModal(false)} className="text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mt-3">
                <div className="search-input">
                  <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={addSearch}
                    onChange={e => setAddSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
              {availableForAdd.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setAdditionalPersonnel(prev => [...prev, p])
                    setShowAddModal(false)
                    setAddSearch('')
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-[var(--color-bg-main)] border-b border-[var(--color-border-light)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-[var(--color-text-dark)]">{p.name}</span>
                      <span className="text-xs text-[var(--color-text-light)] ml-2 font-mono">{p.personnelId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary">{p.rank}</span>
                      <span className="text-xs text-[var(--color-text-light)]">{p.section}</span>
                    </div>
                  </div>
                </button>
              ))}
              {availableForAdd.length === 0 && (
                <div className="p-6 text-center text-xs text-[var(--color-text-light)]">No available personnel found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
