import { useEffect, useRef } from 'react'
import { postLocation } from '../services/api'

const INTERVAL_MS = 5_000

export function useLocationSharing(
  userId: number | null,
  busId: number | null,
  coords: GeolocationCoordinates | null,
  active: boolean
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active || !userId || !busId || !coords) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }

    const send = () => {
      if (!coords) return
      postLocation({
        user_id: userId,
        bus_id: busId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }).catch(() => { /* silent retry next tick */ })
    }

    send() // immediate first ping
    timerRef.current = setInterval(send, INTERVAL_MS)

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }, [active, userId, busId, coords])
}
