import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

const mapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f1629' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f1e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3db' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c2845' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#243155' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#243155' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#151e36' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050d1a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1c2845' }] },
]

export function useGoogleMap(containerRef: React.RefObject<HTMLDivElement>, center: { lat: number; lng: number }) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const loader = new Loader({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' })

    loader.load().then(() => {
      if (!containerRef.current) return
      mapRef.current = new google.maps.Map(containerRef.current, {
        center,
        zoom: 13,
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
      setReady(true)
    }).catch(console.error)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { map: mapRef.current, ready }
}
