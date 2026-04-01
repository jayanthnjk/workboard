import { useEffect, useRef, useCallback } from 'react'
import type { GuardLocation } from '@/types'

const MANGALURU_CENTER = { lat: 12.8714, lng: 74.8425 }
const DEFAULT_ZOOM = 14

const locationTypeLabels: Record<string, string> = {
  'government-office': 'Government Office',
  'bank-currency-chest': 'Bank Currency Chest',
  'court': 'Court',
  'hospital': 'Hospital',
  'ncc': 'NCC',
}

const markerColors: Record<string, string> = {
  'government-office': '#3B82F6',
  'bank-currency-chest': '#22C55E',
  'court': '#8B5CF6',
  'hospital': '#EF4444',
  'ncc': '#1B4D3E',
}

const typeIcons: Record<string, string> = {
  'government-office': '🏛️',
  'bank-currency-chest': '🏦',
  'court': '⚖️',
  'hospital': '🏥',
  'ncc': '🎖️',
}

interface LocationMapProps {
  locations: GuardLocation[]
  onSelectLocation?: (loc: GuardLocation | null) => void
  selectedLocationId?: string | null
}

export function LocationMap({ locations, onSelectLocation, selectedLocationId }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const locationsRef = useRef<GuardLocation[]>(locations)
  const leafletRef = useRef<any>(null)

  locationsRef.current = locations

  const onSelectRef = useRef(onSelectLocation)
  onSelectRef.current = onSelectLocation

  const selectedIdRef = useRef(selectedLocationId)
  selectedIdRef.current = selectedLocationId

  const handleMarkerClick = useCallback((loc: GuardLocation) => {
    onSelectRef.current?.(loc)
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const loadMap = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      leafletRef.current = L

      const map = L.map(mapRef.current!, {
        center: [MANGALURU_CENTER.lat, MANGALURU_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: false,
      })

      L.control.zoom({ position: 'topright' }).addTo(map)
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>')
        .addTo(map)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      locations.forEach(loc => {
        if (!loc.lat || !loc.lng) return
        const color = markerColors[loc.type] || '#1B4D3E'
        const emoji = typeIcons[loc.type] || '📍'
        const typeLabel = locationTypeLabels[loc.type] || loc.type

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 36px; height: 36px; border-radius: 50%;
            background: ${color}; border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 16px; transition: transform 0.15s;
          ">${emoji}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -38],
        })

        const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map)
        marker.bindPopup(`
          <div style="min-width: 200px; font-family: Inter, system-ui, sans-serif; padding: 4px 0;">
            <div style="font-weight: 700; font-size: 13px; color: #1E293B; margin-bottom: 2px;">${loc.name}</div>
            <div style="font-size: 11px; color: #94A3B8; font-family: monospace; margin-bottom: 8px;">${loc.code}</div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; background: ${color}18; color: ${color}; letter-spacing: 0.3px;">${typeLabel}</span>
              <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: ${loc.isActive ? '#22C55E' : '#94A3B8'}; font-weight: 600;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${loc.isActive ? '#22C55E' : '#94A3B8'};"></span>
                ${loc.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style="font-size: 11px; color: #64748B; display: flex; align-items: center; gap: 4px;">
              <span>👥</span> ${loc.requiredPersonnel} personnel required
            </div>
          </div>
        `, { closeButton: true, maxWidth: 260, className: 'custom-popup' })

        marker.on('click', () => handleMarkerClick(loc))
        markersRef.current.set(loc.id, marker)
      })

      L.circle([MANGALURU_CENTER.lat, MANGALURU_CENTER.lng], {
        radius: 3000,
        color: '#1B4D3E',
        fillColor: '#1B4D3E',
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: '6, 4',
      }).addTo(map)

      mapInstanceRef.current = map

      // Apply initial selection highlighting if already selected
      updateMarkerStyles(L)
    }

    loadMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersRef.current.clear()
      }
    }
  }, [locations])

  function updateMarkerStyles(L?: any) {
    const leaflet = L || leafletRef.current
    if (!leaflet || !mapInstanceRef.current) return

    const currentSelectedId = selectedIdRef.current
    const hasSelection = !!currentSelectedId
    const MUTED_COLOR = '#6B7280'

    locationsRef.current.forEach(loc => {
      const marker = markersRef.current.get(loc.id)
      if (!marker) return

      const isSelected = loc.id === currentSelectedId
      // When nothing is selected, show all markers in their normal colorful style
      const showNormal = !hasSelection || isSelected
      const color = showNormal ? (markerColors[loc.type] || '#1B4D3E') : MUTED_COLOR
      const emoji = typeIcons[loc.type] || '📍'
      const size = isSelected ? 44 : 36
      const borderWidth = isSelected ? 3 : 3
      const opacity = showNormal ? 1 : 0.5
      const shadow = isSelected
        ? '0 4px 14px rgba(0,0,0,0.4), 0 0 0 4px rgba(59,130,246,0.25)'
        : '0 2px 10px rgba(0,0,0,0.3)'
      const fontSize = isSelected ? 20 : 16
      const zOffset = isSelected ? 1000 : 0

      const icon = leaflet.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color}; border: ${borderWidth}px solid white;
          box-shadow: ${shadow};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: ${fontSize}px;
          opacity: ${opacity};
        ">${emoji}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size - 2],
      })

      marker.setIcon(icon)
      marker.setZIndexOffset(zOffset)
    })

    if (currentSelectedId) {
      const marker = markersRef.current.get(currentSelectedId)
      if (marker) {
        mapInstanceRef.current.setView(marker.getLatLng(), 16, { animate: true })
        marker.openPopup()
      }
    }
  }

  // Update marker styles and pan to selected location
  useEffect(() => {
    selectedIdRef.current = selectedLocationId
    updateMarkerStyles()
  }, [selectedLocationId])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}

export default LocationMap
