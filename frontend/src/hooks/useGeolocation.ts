import { useState, useEffect, useRef, useCallback } from 'react'

interface GeoState {
  coords: GeolocationCoordinates | null
  error: string | null
  loading: boolean
}

export function useGeolocation(enabled: boolean = true) {
  const [state, setState] = useState<GeoState>({ coords: null, error: null, loading: false })
  const watchRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) { stop(); return }
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser.' }))
      return
    }

    setState((s) => ({ ...s, loading: true }))
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => setState({ coords: pos.coords, error: null, loading: false }),
      (err) => setState((s) => ({ ...s, error: err.message, loading: false })),
      { enableHighAccuracy: true, maximumAge: 4_000, timeout: 10_000 }
    )

    return stop
  }, [enabled, stop])

  return { ...state, stop }
}
