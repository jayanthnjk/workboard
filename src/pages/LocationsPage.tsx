import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Pagination } from '@/components/common/Pagination'
import { guardLocations } from '@/data/seedData'
import type { GuardLocation } from '@/types'

const LocationMap = lazy(() => import('@/components/common/LocationMap'))

type LocationType = 'all' | 'government-office' | 'bank-currency-chest' | 'court' | 'hospital' | 'ncc'
type ViewTab = 'map' | 'list'

const locationTypeLabels: Record<string, string> = {
  'government-office': 'Government Office',
  'bank-currency-chest': 'Bank Currency Chest',
  'court': 'Court',
  'hospital': 'Hospital',
  'ncc': 'NCC',
}

const locationTypeColors: Record<string, { bg: string; text: string; icon: string; color: string }> = {
  'government-office': { bg: 'bg-blue-50', text: 'text-[var(--color-info)]', icon: '🏛️', color: '#3B82F6' },
  'bank-currency-chest': { bg: 'bg-green-50', text: 'text-[var(--color-success)]', icon: '🏦', color: '#22C55E' },
  'court': { bg: 'bg-purple-50', text: 'text-[var(--color-accent-purple)]', icon: '⚖️', color: '#8B5CF6' },
  'hospital': { bg: 'bg-red-50', text: 'text-[var(--color-error)]', icon: '🏥', color: '#EF4444' },
  'ncc': { bg: 'bg-emerald-50', text: 'text-[var(--color-primary)]', icon: '🎖️', color: '#1B4D3E' },
}

export default function LocationsPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<ViewTab>('map')
  const [typeFilter, setTypeFilter] = useState<LocationType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedLocation, setSelectedLocation] = useState<GuardLocation | null>(null)
  const [sidebarSearch, setSidebarSearch] = useState('')

  const filteredLocations = useMemo(() => {
    return guardLocations.filter(loc => {
      if (typeFilter !== 'all' && loc.type !== typeFilter) return false
      if (!showInactive && !loc.isActive) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!loc.name.toLowerCase().includes(q) && !loc.code.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [typeFilter, searchQuery, showInactive])

  const sidebarLocations = useMemo(() => {
    if (!sidebarSearch) return filteredLocations
    const q = sidebarSearch.toLowerCase()
    return filteredLocations.filter(loc =>
      loc.name.toLowerCase().includes(q) || loc.code.toLowerCase().includes(q)
    )
  }, [filteredLocations, sidebarSearch])

  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, searchQuery, showInactive])

  const paginatedLocations = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLocations.slice(start, start + pageSize)
  }, [filteredLocations, currentPage, pageSize])

  const stats = useMemo(() => {
    const active = guardLocations.filter(l => l.isActive)
    const totalPersonnel = active.reduce((sum, l) => sum + l.requiredPersonnel, 0)
    const byType = Object.entries(locationTypeLabels).map(([type, label]) => ({
      type,
      label,
      count: active.filter(l => l.type === type).length,
    }))
    return { total: guardLocations.length, active: active.length, totalPersonnel, byType }
  }, [])

  const getTypeStyle = (type: string) => locationTypeColors[type] || { bg: 'bg-gray-50', text: 'text-gray-600', icon: '📍', color: '#6B7280' }

  return (
    <div className="space-y-4">
      {/* Header Row — title + tab switcher + stats inline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('locations')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">Mangaluru City Division — {stats.active} active of {stats.total} locations · {stats.totalPersonnel} personnel</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center gap-0.5 p-0.5 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              Map
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'list'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              List
            </button>
          </div>
        </div>
      </div>

      {/* ===== MAP VIEW ===== */}
      {activeTab === 'map' && (
        <div className="card overflow-hidden" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
          <div className="flex h-full">
            {/* Sidebar — location list */}
            <div className="w-72 xl:w-80 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-bg-card)] shrink-0 hidden md:flex">
              {/* Sidebar header */}
              <div className="p-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--color-bg-main)] rounded-lg border border-[var(--color-border)]">
                  <svg className="w-3.5 h-3.5 text-[var(--color-text-light)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={sidebarSearch}
                    onChange={e => setSidebarSearch(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] outline-none"
                  />
                  {sidebarSearch && (
                    <button onClick={() => setSidebarSearch('')} className="text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-[10px] text-[var(--color-text-light)] font-medium">{sidebarLocations.length} locations</span>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value as LocationType)}
                    className="text-[10px] bg-transparent text-[var(--color-text-medium)] outline-none cursor-pointer border-none p-0"
                  >
                    <option value="all">All Types</option>
                    {Object.entries(locationTypeLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scrollable location list */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {sidebarLocations.map(loc => {
                  const style = getTypeStyle(loc.type)
                  const isSelected = selectedLocation?.id === loc.id
                  return (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocation(isSelected ? null : loc)}
                      className={`w-full text-left px-3 py-2.5 border-b border-[var(--color-border-light)] transition-colors ${
                        isSelected
                          ? 'bg-[var(--color-green-50)]'
                          : 'hover:bg-[var(--color-bg-main)]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm mt-0.5">{style.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-[var(--color-text-dark)] truncate">{loc.name}</span>
                            <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${loc.isActive ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-light)]'}`} />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[var(--color-text-light)] font-mono">{loc.code}</span>
                            <span className="text-[10px] text-[var(--color-text-light)]">·</span>
                            <span className="text-[10px] text-[var(--color-text-light)]">👥 {loc.requiredPersonnel}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {sidebarLocations.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-xs text-[var(--color-text-light)]">No locations found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Map area */}
            <div className="flex-1 relative">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-main)]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-[var(--color-text-medium)]">Loading map...</p>
                  </div>
                </div>
              }>
                <LocationMap
                  locations={filteredLocations}
                  onSelectLocation={setSelectedLocation}
                  selectedLocationId={selectedLocation?.id}
                />
              </Suspense>

              {/* Selected location detail card — floating on map */}
              {selectedLocation && (
                <div className="absolute top-3 right-14 z-[1000] w-64 bg-[var(--color-bg-card)]/95 backdrop-blur-sm rounded-xl border border-[var(--color-border)] shadow-xl p-4 md:hidden block">
                  <LocationDetailCard location={selectedLocation} onClose={() => setSelectedLocation(null)} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="filter-bar flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="search-input">
                <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] outline-none"
                />
              </div>
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as LocationType)}
              className="input w-auto min-w-[180px]"
            >
              <option value="all">All Types</option>
              {Object.entries(locationTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-medium)] cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="rounded border-[var(--color-border)]"
              />
              Show Inactive
            </label>
          </div>

          {/* Location Type Summary */}
          <div className="flex flex-wrap gap-2">
            {stats.byType.filter(t => t.count > 0).map(({ type, label, count }) => {
              const style = getTypeStyle(type)
              return (
                <span key={type} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                  {style.icon} {label}: {count}
                </span>
              )
            })}
          </div>

          {/* Location Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedLocations.map(loc => {
              const style = getTypeStyle(loc.type)
              return (
                <div key={loc.id} className="card-hover p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{style.icon}</span>
                      <div>
                        <h3 className="font-semibold text-sm text-[var(--color-text-dark)]">{loc.name}</h3>
                        <p className="text-xs text-[var(--color-text-light)] font-mono">{loc.code}</p>
                      </div>
                    </div>
                    <span className={`badge ${loc.isActive ? 'badge-success' : 'badge-error'}`}>
                      {loc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {locationTypeLabels[loc.type] || loc.type}
                    </span>
                    <span className="text-xs text-[var(--color-text-medium)]">
                      👥 {loc.requiredPersonnel} personnel
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredLocations.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-[var(--color-text-light)]">No locations found matching your filters.</p>
            </div>
          )}

          {filteredLocations.length > 0 && (
            <div className="card overflow-hidden">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredLocations.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LocationDetailCard({ location, onClose }: { location: GuardLocation; onClose: () => void }) {
  const style = locationTypeColors[location.type] || { icon: '📍', color: '#6B7280', bg: 'bg-gray-50', text: 'text-gray-600' }
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{style.icon}</span>
          <div>
            <h3 className="font-semibold text-sm text-[var(--color-text-dark)]">{location.name}</h3>
            <p className="text-[10px] text-[var(--color-text-light)] font-mono">{location.code}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[var(--color-text-light)] hover:text-[var(--color-text-medium)] p-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
            {locationTypeLabels[location.type] || location.type}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${location.isActive ? 'text-[var(--color-success)]' : 'text-[var(--color-text-light)]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${location.isActive ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-light)]'}`} />
            {location.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-medium)]">👥 {location.requiredPersonnel} personnel required</p>
        {location.lat && location.lng && (
          <p className="text-[10px] text-[var(--color-text-light)] font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
        )}
      </div>
    </div>
  )
}


