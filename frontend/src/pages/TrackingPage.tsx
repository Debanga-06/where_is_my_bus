import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Navigation, Radio, AlertCircle, ArrowLeft, Bus, RefreshCw } from 'lucide-react'
import { getStopsForRoute, getBusETA } from '../services/api'
import { useAppStore } from '../context/store'
import { useGeolocation } from '../hooks/useGeolocation'
import { useLocationSharing } from '../hooks/useLocationSharing'
import { useRouteBusSocket } from '../hooks/useWebSocket'
import { BusMap } from '../components/map/BusMap'
import { CrowdBadge } from '../components/ui/CrowdBadge'
import { ETACard } from '../components/ui/ETACard'
import { Spinner } from '../components/ui/Spinner'
import type { BusLocation, ETAResponse, BusStop } from '../types'

export default function TrackingPage() {
  const { busId } = useParams<{ busId: string }>()
  const navigate = useNavigate()
  const { user, selectedRoute, selectedBus, setStops } = useAppStore()

  const [stops, setLocalStops] = useState<BusStop[]>([])
  const [busLocations, setBusLocations] = useState<BusLocation[]>([])
  const [activeBus, setActiveBus] = useState<BusLocation | null>(null)
  const [eta, setEta] = useState<ETAResponse | null>(null)
  const [loadingStops, setLoadingStops] = useState(true)
  const [trackingEnabled, setTrackingEnabled] = useState(false)
  const [geoError, setGeoError] = useState('')

  const { coords, error: geoHookError } = useGeolocation(trackingEnabled)

  // Share location every 5 s when tracking is active
  useLocationSharing(user?.id ?? null, Number(busId), coords, trackingEnabled)

  // WebSocket — subscribe to the selected route's bus updates
  const handleWsUpdate = useCallback((buses: BusLocation[]) => {
    setBusLocations(buses)
    const mine = buses.find((b) => b.bus_id === Number(busId))
    if (mine) setActiveBus(mine)
  }, [busId])

  useRouteBusSocket(selectedRoute?.id ?? null, handleWsUpdate)

  // Load stops and initial ETA
  useEffect(() => {
    if (!user) { navigate('/'); return }
    if (!selectedRoute) { navigate('/routes'); return }
    if (!busId) { navigate(-1); return }

    getStopsForRoute(selectedRoute.id)
      .then((s) => { setLocalStops(s); setStops(s) })
      .finally(() => setLoadingStops(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll ETA every 10 s when there is an active bus
  useEffect(() => {
    if (!busId || !activeBus) return
    const refresh = () =>
      getBusETA(Number(busId))
        .then(setEta)
        .catch(() => setEta(null))

    refresh()
    const t = setInterval(refresh, 10_000)
    return () => clearInterval(t)
  }, [busId, activeBus])

  const handleTrackToggle = () => {
    if (!trackingEnabled) {
      setGeoError('')
      setTrackingEnabled(true)
    } else {
      setTrackingEnabled(false)
    }
  }

  useEffect(() => {
    if (geoHookError) setGeoError(geoHookError)
  }, [geoHookError])

  if (loadingStops) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col pt-16">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-surface-700 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <Bus className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-white text-sm">{selectedBus?.bus_number}</span>
        </div>

        <button
          onClick={handleTrackToggle}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition
            ${trackingEnabled
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
        >
          <Radio className="w-3.5 h-3.5" />
          {trackingEnabled ? 'Stop sharing' : 'Share location'}
        </button>
      </div>

      {/* ── Map + sidebar layout ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative min-h-64">
          <BusMap
            busLocations={busLocations}
            userCoords={coords}
            stops={stops}
            activeBusId={Number(busId)}
            onBusClick={setActiveBus}
          />

          {/* Live indicator */}
          {trackingEnabled && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-surface-900/80 backdrop-blur rounded-lg px-3 py-1.5 border border-surface-600">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-white">Broadcasting</span>
            </div>
          )}

          {busLocations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-surface-800/90 backdrop-blur border border-surface-600 rounded-2xl px-6 py-4 text-center">
                <RefreshCw className="w-6 h-6 text-brand-400 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-slate-300">Waiting for passenger data…</p>
                <p className="text-xs text-slate-500 mt-1">Share your location to get started.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar panel */}
        <aside className="w-full lg:w-80 flex-shrink-0 bg-surface-800 border-t lg:border-t-0 lg:border-l border-surface-700 overflow-y-auto p-4 space-y-4">
          {/* Geo error */}
          {geoError && (
            <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {geoError}
            </div>
          )}

          {/* Active bus info */}
          {activeBus && (
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-brand-400" />
                  <span className="font-bold text-white">{activeBus.bus_number}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {activeBus.latitude.toFixed(4)}, {activeBus.longitude.toFixed(4)}
                </span>
              </div>
              <CrowdBadge level={activeBus.crowd_level} count={activeBus.active_passengers} />
            </div>
          )}

          {/* ETA card */}
          {eta ? (
            <ETACard eta={eta} />
          ) : activeBus ? (
            <div className="glass-card p-4 flex items-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" />
              Calculating ETA…
            </div>
          ) : (
            <div className="glass-card p-4 text-sm text-slate-500 text-center">
              No live data yet.<br />Board the bus and share your location.
            </div>
          )}

          {/* All buses on route */}
          {busLocations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Buses on Route</h4>
              {busLocations.map((b) => (
                <button
                  key={b.bus_id}
                  onClick={() => setActiveBus(b)}
                  className={`glass-card w-full p-3 flex items-center justify-between text-left
                    ${b.bus_id === Number(busId) ? 'border-brand-500/40' : 'hover:border-surface-500'}`}
                >
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-brand-400" />
                    <span className="text-sm font-medium text-white">{b.bus_number}</span>
                  </div>
                  <CrowdBadge level={b.crowd_level} count={b.active_passengers} className="text-xs px-2 py-0.5" />
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
