import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import type { BusLocation, BusStop } from '../../types'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

const DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f1629' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f1e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3db' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c2845' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#243155' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#151e36' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050d1a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1c2845' }] },
]

interface Props {
  busLocations: BusLocation[]
  userCoords: GeolocationCoordinates | null
  stops: BusStop[]
  activeBusId: number | null
  onBusClick?: (bus: BusLocation) => void
}

export function BusMap({ busLocations, userCoords, stops, activeBusId, onBusClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const busMarkersRef = useRef<Map<number, google.maps.Marker>>(new Map())
  const stopMarkersRef = useRef<google.maps.Marker[]>([])
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // ── Load Google Maps SDK ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    new Loader({ apiKey: API_KEY, version: 'weekly' }).load().then(() => {
      const defaultCenter = stops.length
        ? { lat: stops[0].latitude, lng: stops[0].longitude }
        : { lat: 22.68, lng: 88.44 }

      mapRef.current = new google.maps.Map(containerRef.current!, {
        center: defaultCenter,
        zoom: 13,
        styles: DARK_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
      })
      setMapReady(true)
    }).catch(console.error)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draw route polyline ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || stops.length === 0) return

    polylineRef.current?.setMap(null)
    polylineRef.current = new google.maps.Polyline({
      path: stops.map((s) => ({ lat: s.latitude, lng: s.longitude })),
      geodesic: true,
      strokeColor: '#0ea5e9',
      strokeOpacity: 0.6,
      strokeWeight: 3,
      map: mapRef.current,
    })

    // Bus stop markers
    stopMarkersRef.current.forEach((m) => m.setMap(null))
    stopMarkersRef.current = stops.map((stop, i) => {
      const isTerminus = i === 0 || i === stops.length - 1
      return new google.maps.Marker({
        position: { lat: stop.latitude, lng: stop.longitude },
        map: mapRef.current!,
        title: stop.stop_name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isTerminus ? 9 : 6,
          fillColor: isTerminus ? '#0ea5e9' : '#1c2845',
          fillOpacity: 1,
          strokeColor: '#0ea5e9',
          strokeWeight: 2,
        },
        label: isTerminus ? undefined : undefined,
      })
    })
  }, [mapReady, stops])

  // ── Bus markers ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    const seen = new Set<number>()
    busLocations.forEach((bus) => {
      seen.add(bus.bus_id)
      const pos = { lat: bus.latitude, lng: bus.longitude }
      const isActive = bus.bus_id === activeBusId

      if (busMarkersRef.current.has(bus.bus_id)) {
        const marker = busMarkersRef.current.get(bus.bus_id)!
        marker.setPosition(pos)
        marker.setIcon(busIcon(isActive))
      } else {
        const marker = new google.maps.Marker({
          position: pos,
          map: mapRef.current!,
          title: bus.bus_number,
          icon: busIcon(isActive),
          zIndex: isActive ? 100 : 10,
        })
        marker.addListener('click', () => onBusClick?.(bus))
        busMarkersRef.current.set(bus.bus_id, marker)
      }
    })

    // Remove stale markers
    busMarkersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) { marker.setMap(null); busMarkersRef.current.delete(id) }
    })
  }, [mapReady, busLocations, activeBusId, onBusClick])

  // ── User location marker ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userCoords) return

    const pos = { lat: userCoords.latitude, lng: userCoords.longitude }
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(pos)
    } else {
      userMarkerRef.current = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: 'You',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#22d3ee',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 200,
      })
    }
  }, [mapReady, userCoords])

  return (
    <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden" />
  )
}

function busIcon(active: boolean): google.maps.Symbol {
  return {
    path: 'M -2,-3 L 2,-3 L 3,0 L 3,2 L -3,2 L -3,0 Z',
    scale: active ? 5 : 3.5,
    fillColor: active ? '#0ea5e9' : '#38bdf8',
    fillOpacity: 1,
    strokeColor: active ? '#ffffff' : '#0ea5e9',
    strokeWeight: active ? 2 : 1,
    rotation: 0,
  }
}
