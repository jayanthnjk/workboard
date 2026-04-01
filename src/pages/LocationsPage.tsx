import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/context/LanguageContext'
import { useNotifications } from '@/context/NotificationContext'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/Modal'
import type { GuardLocation, GuardLocationType } from '@/types'

const LocationMap = lazy(() => import('@/components/common/LocationMap'))

const locationTypeLabelKeys: Record<string, string> = {
  'government-office': 'government_office',
  'bank-currency-chest': 'bank_currency_chest',
  'court': 'court',
  'hospital': 'hospital',
  'ncc': 'ncc',
  'other': 'other',
}

const locationTypeColors: Record<string, { bg: string; text: string; icon: string }> = {
  'government-office': { bg: 'bg-blue-50', text: 'text-[var(--color-info)]', icon: '🏛️' },
  'bank-currency-chest': { bg: 'bg-green-50', text: 'text-[var(--color-success)]', icon: '🏦' },
  'court': { bg: 'bg-purple-50', text: 'text-[var(--color-accent-purple)]', icon: '⚖️' },
  'hospital': { bg: 'bg-red-50', text: 'text-[var(--color-error)]', icon: '🏥' },
  'ncc': { bg: 'bg-emerald-50', text: 'text-[var(--color-primary)]', icon: '🎖️' },
  'other': { bg: 'bg-gray-50', text: 'text-gray-600', icon: '📍' },
}

const GUARD_LOCATION_TYPES: GuardLocationType[] = [
  'government-office', 'bank-currency-chest', 'court', 'hospital', 'ncc', 'other',
]

export default function LocationsPage() {
  const { t } = useLanguage()
  const { showToast } = useNotifications()
  const navigate = useNavigate()

  const [locations, setLocations] = useState<GuardLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<GuardLocation | null>(null)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingLocation, setDeletingLocation] = useState<GuardLocation | null>(null)

  useEffect(() => { fetchLocations() }, [])

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const res = await apiGateway.getGuardLocations()
      if (res.success) setLocations(res.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      if (typeFilter !== 'all' && loc.type !== typeFilter) return false
      return true
    })
  }, [locations, typeFilter])

  // Sidebar filtered
  const sidebarLocations = useMemo(() => {
    const base = locations.filter(loc => typeFilter === 'all' || loc.type === typeFilter)
    if (!sidebarSearch) return base
    const q = sidebarSearch.toLowerCase()
    return base.filter(loc => loc.name.toLowerCase().includes(q) || loc.code.toLowerCase().includes(q))
  }, [locations, typeFilter, sidebarSearch])

  // Stats
  const stats = useMemo(() => {
    const active = locations.filter(l => l.isActive)
    const totalPersonnel = active.reduce((sum, l) => sum + l.requiredPersonnel, 0)
    const typeSet = new Set(locations.map(l => l.type))
    return { total: locations.length, active: active.length, totalPersonnel, typeCount: typeSet.size }
  }, [locations])

  const getTypeStyle = (type: string) => locationTypeColors[type] || locationTypeColors['other']

  // ---- CRUD handlers ----
  const handleDelete = async () => {
    if (!deletingLocation) return
    try {
      const res = await apiGateway.deleteGuardLocation(deletingLocation.id)
      if (res.success) {
        showToast({ type: 'success', title: t('location_deleted') })
        if (selectedLocation?.id === deletingLocation.id) setSelectedLocation(null)
        fetchLocations()
      } else {
        showToast({ type: 'error', title: res.error || 'Error' })
      }
    } catch {
      showToast({ type: 'error', title: 'An error occurred' })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingLocation(null)
    }
  }

  const openDelete = (loc: GuardLocation) => {
    setDeletingLocation(loc)
    setDeleteDialogOpen(true)
  }

  // ---- DataTable columns ----
  const columns: Column<GuardLocation>[] = [
    {
      key: 'name',
      header: t('name'),
      sortable: true,
      accessor: row => {
        const s = getTypeStyle(row.type)
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{s.icon}</span>
            <span className="font-medium text-[var(--color-text-dark)]">{row.name}</span>
          </div>
        )
      },
      rawValue: row => row.name,
    },
    {
      key: 'code',
      header: t('code'),
      sortable: true,
      accessor: row => <span className="font-mono text-xs">{row.code}</span>,
      rawValue: row => row.code,
    },
    {
      key: 'type',
      header: t('type'),
      sortable: true,
      accessor: row => {
        const s = getTypeStyle(row.type)
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.text}`}>
            {t(locationTypeLabelKeys[row.type]) || row.type}
          </span>
        )
      },
      rawValue: row => row.type,
    },
    {
      key: 'personnel',
      header: t('required_personnel_field'),
      sortable: true,
      accessor: row => <span className="text-sm">👥 {row.requiredPersonnel}</span>,
      rawValue: row => row.requiredPersonnel,
    },
    {
      key: 'status',
      header: t('status'),
      sortable: true,
      accessor: row => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'badge-error'}`}>
          {row.isActive ? t('active') : t('inactive')}
        </span>
      ),
      rawValue: row => row.isActive ? 'active' : 'inactive',
    },
    {
      key: 'actions',
      header: '',
      accessor: row => (
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/locations/${row.id}/edit`) }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#6b5c42] bg-[rgba(107,92,66,0.05)] hover:bg-[rgba(107,92,66,0.1)] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            {t('edit')}
          </button>
          <button
            onClick={e => { e.stopPropagation(); openDelete(row) }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#ba1a1a] bg-[rgba(186,26,26,0.05)] hover:bg-[rgba(186,26,26,0.1)] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            {t('delete')}
          </button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[var(--color-text-medium)]">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('locations')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">
            {t('location_subtitle').replace('{0}', String(stats.active)).replace('{1}', String(stats.total)).replace('{2}', String(stats.totalPersonnel))}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Map / List tab switcher */}
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
              {t('map')}
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
              {t('list')}
            </button>
          </div>
          <button onClick={() => navigate('/locations/add')} className="btn btn-primary">
            {t('add_location_btn')}
          </button>
        </div>
      </div>

      {/* ===== Stat Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('total_locations'), value: stats.total, icon: '📍' },
          { label: t('active'), value: stats.active, icon: '✅' },
          { label: t('personnel_required'), value: stats.totalPersonnel, icon: '👥' },
          { label: t('location_types'), value: stats.typeCount, icon: '🏷️' },
        ].map(s => (
          <div key={s.label} className="card p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.icon}</span>
              <div>
                <p className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide">{s.label}</p>
                <p className="text-lg font-bold text-[var(--color-text-dark)]">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Type Filter Pills ===== */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            typeFilter === 'all'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-medium)] border border-[var(--color-border)] hover:bg-[var(--color-bg-main)]'
          }`}
        >
          {t('all_locations')}
        </button>
        {GUARD_LOCATION_TYPES.map(type => {
          const s = getTypeStyle(type)
          const count = locations.filter(l => l.type === type).length
          if (count === 0) return null
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                typeFilter === type
                  ? 'bg-[var(--color-primary)] text-white'
                  : `${s.bg} ${s.text} hover:opacity-80`
              }`}
            >
              {s.icon} {t(locationTypeLabelKeys[type])}: {count}
            </button>
          )
        })}
      </div>

      {/* ===== Map View ===== */}
      {activeTab === 'map' && (
      <div className="card overflow-hidden" style={{ height: '420px' }}>
        <div className="flex h-full">
          {/* Left: Location sidebar list */}
          <div className="w-72 xl:w-80 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-bg-card)] shrink-0 hidden md:flex">
            <div className="p-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--color-bg-main)] rounded-lg border border-[var(--color-border)]">
                <svg className="w-3.5 h-3.5 text-[var(--color-text-light)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder={t('search_locations')}
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
                <span className="text-[10px] text-[var(--color-text-light)] font-medium">{sidebarLocations.length} {t('locations')}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {sidebarLocations.map(loc => {
                const style = getTypeStyle(loc.type)
                const isSelected = selectedLocation?.id === loc.id
                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(isSelected ? null : loc)}
                    className={`w-full text-left px-3 py-2.5 border-b border-[var(--color-border-light)] transition-colors ${
                      isSelected ? 'bg-[var(--color-green-50)]' : 'hover:bg-[var(--color-bg-main)]'
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
                  <p className="text-xs text-[var(--color-text-light)]">{t('no_locations_found')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Map */}
          <div className="flex-1 relative">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-main)]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[var(--color-text-medium)]">{t('loading_map')}</p>
                </div>
              </div>
            }>
              <LocationMap
                locations={filteredLocations}
                onSelectLocation={setSelectedLocation}
                selectedLocationId={selectedLocation?.id}
              />
            </Suspense>

            {/* Floating detail card on map */}
            {selectedLocation && (
              <div className="absolute top-3 right-3 z-[1000] w-64 bg-[var(--color-bg-card)]/95 backdrop-blur-sm rounded-xl border border-[var(--color-border)] shadow-xl p-4">
                <LocationDetailCard
                  location={selectedLocation}
                  onClose={() => setSelectedLocation(null)}
                  onEdit={() => navigate(`/locations/${selectedLocation.id}/edit`)}
                  onDelete={() => openDelete(selectedLocation)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ===== List View (DataTable) ===== */}
      {activeTab === 'list' && (
      <div className="card">
        <DataTable
          data={filteredLocations}
          columns={columns}
          keyExtractor={row => row.id}
          loading={loading}
          emptyMessage={t('no_locations_found_filters')}
          onRowClick={row => setSelectedLocation(selectedLocation?.id === row.id ? null : row)}
        />
      </div>
      )}

      {/* ===== Delete Confirmation ===== */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t('delete_location')}
        message={t('delete_location_confirm').replace('{0}', deletingLocation?.name || '')}
        confirmText={t('delete')}
        variant="danger"
      />
    </div>
  )
}

function LocationDetailCard({
  location,
  onClose,
  onEdit,
  onDelete,
}: {
  location: GuardLocation
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useLanguage()
  const style = locationTypeColors[location.type] || locationTypeColors['other']
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
            {t(locationTypeLabelKeys[location.type]) || location.type}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${location.isActive ? 'text-[var(--color-success)]' : 'text-[var(--color-text-light)]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${location.isActive ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-light)]'}`} />
            {location.isActive ? t('active') : t('inactive')}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-medium)]">👥 {location.requiredPersonnel} {t('personnel_required_label')}</p>
        {location.lat != null && location.lng != null && (
          <p className="text-[10px] text-[var(--color-text-light)] font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#6b5c42] bg-[rgba(107,92,66,0.05)] hover:bg-[rgba(107,92,66,0.1)] transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
          {t('edit')}
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#ba1a1a] bg-[rgba(186,26,26,0.05)] hover:bg-[rgba(186,26,26,0.1)] transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          {t('delete')}
        </button>
      </div>
    </div>
  )
}
