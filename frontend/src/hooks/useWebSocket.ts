import { useEffect, useRef, useCallback } from 'react'
import type { BusLocation, WsBusPayload } from '../types'

const WS_BASE = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}/ws`

export function useRouteBusSocket(
  routeId: number | null,
  onUpdate: (buses: BusLocation[]) => void
) {
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const connect = useCallback(() => {
    if (!routeId) return
    const url = `${WS_BASE}/route/${routeId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (evt) => {
      try {
        const payload: WsBusPayload = JSON.parse(evt.data)
        if (payload.buses) onUpdateRef.current(payload.buses)
      } catch { /* ignore malformed frames */ }
    }

    ws.onclose = () => {
      // reconnect after 3 s
      retryRef.current = setTimeout(connect, 3_000)
    }

    ws.onerror = () => ws.close()
  }, [routeId])

  useEffect(() => {
    connect()
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])
}
