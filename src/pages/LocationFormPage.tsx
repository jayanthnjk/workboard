import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '@/context/LanguageContext'
import { useNotifications } from '@/context/NotificationContext'
import { apiGateway } from '@/services/apiGateway'
import type { GuardLocation } from '@/types'

const MANGALURU_CENTER = { lat: 12.8714, lng: 74.8425 }

const PRESET_TYPES = [
  'government-office', 'bank-currency-chest', 'court', 'hospital', 'ncc', 'other',
]

const typeLabels: Record<string, string> = {
  'government-office': 'government_office',
  'bank-currency-chest': 'bank_currency_chest',
  'court': 'court',
  'hospital': 'hospital',
  'ncc': 'ncc',
  'other': 'other',
}

export default function LocationFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { showToast } = useNotifications()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [locationType, setLocationType] = useState('government-office')
  const [customType, setCustomType] = useState('')
  const [useCustomType, setUseCustomType] = useState(false)
  const [address, setAddress] = useState('')
  const [requiredPersonnel, setRequiredPersonnel] = useState(1)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)

  // Load existing location for edit
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      setLoading(true)
      const res = await apiGateway.getGuardLocations()
      if (res.success) {
        const loc = res.data.find((l: GuardLocation) => l.id === id)
        if (loc) {
          setName(loc.name)
          setCode(loc.code)
          if (PRESET_TYPES.includes(loc.type)) {
            setLocationType(loc.type)
            setUseCustomType(false)
          } else {
            setUseCustomType(true)
            setCustomType(loc.type)
          }
          setAddress(loc.address || '')
          setRequiredPersonnel(loc.requiredPersonnel)
          setLat(loc.lat != null ? String(loc.lat) : '')
          setLng(loc.lng != null ? String(loc.lng) : '')
          setIsActive(loc.isActive)
        }
      }
      setLoading(false)
    }
    load()
  }, [id, isEdit])

  // Update marker position when lat/lng change from inputs
  const updateMarkerFromInputs = useCallback((latVal: string, lngVal: string) => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return
    const latNum = parseFloat(latVal)
    const lngNum = parseFloat(lngVal)
    if (isNaN(latNum) || isNaN(lngNum)) {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
      return
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([latNum, lngNum])
    } else {
      markerRef.current = L.marker([latNum, lngNum], {
        draggable: true,
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:40px;height:40px;border-radius:50%;background:#000080;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:grab;">📍</div>`,
          iconSize: [40, 40], iconAnchor: [20, 40],
        }),
      }).addTo(map)
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng()
        setLat(pos.lat.toFixed(6))
        setLng(pos.lng.toFixed(6))
      })
    }
    map.setView([latNum, lngNum], Math.max(map.getZoom(), 15), { animate: true })
  }, [])

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const initMap = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      leafletRef.current = L

      const map = L.map(mapRef.current!, {
        center: [MANGALURU_CENTER.lat, MANGALURU_CENTER.lng],
        zoom: 13, zoomControl: true, scrollWheelZoom: true,
        attributionControl: false,
      })
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>')
        .addTo(map)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      // Click on map to pick location
      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng
        setLat(clickLat.toFixed(6))
        setLng(clickLng.toFixed(6))
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng])
        } else {
          markerRef.current = L.marker([clickLat, clickLng], {
            draggable: true,
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div style="width:40px;height:40px;border-radius:50%;background:#000080;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:grab;">📍</div>`,
              iconSize: [40, 40], iconAnchor: [20, 40],
            }),
          }).addTo(map)
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current.getLatLng()
            setLat(pos.lat.toFixed(6))
            setLng(pos.lng.toFixed(6))
          })
        }
      })

      mapInstanceRef.current = map
    }
    initMap()
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markerRef.current = null } }
  }, [])

  // When lat/lng state changes, update marker
  useEffect(() => {
    updateMarkerFromInputs(lat, lng)
  }, [lat, lng, updateMarkerFromInputs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const finalType = useCustomType ? customType.trim() : locationType
    const payload = {
      name, code, type: finalType,
      address: address || undefined,
      requiredPersonnel: Number(requiredPersonnel),
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      isActive,
    }
    try {
      if (isEdit && id) {
        const res = await apiGateway.updateGuardLocation(id, payload)
        if (res.success) { showToast({ type: 'success', title: t('location_updated') }); navigate('/locations') }
        else showToast({ type: 'error', title: res.error || 'Error' })
      } else {
        const res = await apiGateway.createGuardLocation(payload)
        if (res.success) { showToast({ type: 'success', title: t('location_created') }); navigate('/locations') }
        else showToast({ type: 'error', title: res.error || 'Error' })
      }
    } catch { showToast({ type: 'error', title: 'An error occurred' }) }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/locations')} className="p-2 rounded-lg hover:bg-[var(--color-bg-card)] transition-colors text-[var(--color-text-medium)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{isEdit ? t('edit_location') : t('add_location_btn')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('click_map_pick')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Form fields */}
        <div className="card p-5 space-y-4">
          {/* Name + Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-dark)] mb-1 block">{t('location_name')} <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input w-full" placeholder="e.g., Commissioner Office" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-dark)] mb-1 block">{t('location_code')} <span className="text-red-500">*</span></label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required maxLength={15} className="input w-full" placeholder="e.g., GL-CO" />
            </div>
          </div>

          {/* Type — preset or custom */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-dark)] mb-1 block">{t('location_type')} <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-medium)] cursor-pointer">
                <input type="radio" checked={!useCustomType} onChange={() => setUseCustomType(false)} className="accent-[var(--color-primary)]" />
                {t('preset_type')}
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-medium)] cursor-pointer">
                <input type="radio" checked={useCustomType} onChange={() => setUseCustomType(true)} className="accent-[var(--color-primary)]" />
                {t('custom_type')}
              </label>
            </div>
            {useCustomType ? (
              <input type="text" value={customType} onChange={e => setCustomType(e.target.value)} required className="input w-full" placeholder={t('enter_custom_type')} />
            ) : (
              <select value={locationType} onChange={e => setLocationType(e.target.value)} className="input w-full">
                {PRESET_TYPES.map(type => (
                  <option key={type} value={type}>{t(typeLabels[type]) || type}</option>
                ))}
              </select>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-dark)] mb-1 block">{t('address')}</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="input w-full" placeholder={t('placeholder_optional_desc')} />
          </div>

          {/* Required Personnel */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-dark)] mb-1 block">{t('required_personnel_field')} <span className="text-red-500">*</span></label>
            <input type="number" min={1} value={requiredPersonnel} onChange={e => setRequiredPersonnel(Number(e.target.value))} required className="input w-full" />
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-dark)] mb-1 block">{t('latitude')}</label>
              <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} className="input w-full" placeholder="12.8714" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-dark)] mb-1 block">{t('longitude')}</label>
              <input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} className="input w-full" placeholder="74.8425" />
            </div>
          </div>
          <p className="text-[10px] text-[var(--color-text-light)]">{t('click_map_pick')}</p>

          {/* Active */}
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-medium)] cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded border-[var(--color-border)]" />
            {t('active')}
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button type="button" onClick={() => navigate('/locations')} className="btn btn-secondary">{t('cancel')}</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? t('loading') : isEdit ? t('update') : t('create')}
            </button>
          </div>
        </div>

        {/* Right: Interactive Map */}
        <div className="card overflow-hidden" style={{ minHeight: '480px' }}>
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '480px' }} />
        </div>
      </form>
    </div>
  )
}
