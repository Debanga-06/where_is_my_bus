import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bus, ChevronRight, ArrowLeft } from 'lucide-react'
import { getBusesForRoute } from '../services/api'
import { useAppStore } from '../context/store'
import { Spinner } from '../components/ui/Spinner'
import type { Bus as BusType } from '../types'

export default function BusesPage() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()
  const { user, selectedRoute, setSelectedBus } = useAppStore()
  const [buses, setBuses] = useState<BusType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/'); return }
    if (!routeId) { navigate('/routes'); return }

    getBusesForRoute(Number(routeId))
      .then(setBuses)
      .catch(() => setError('Failed to load buses.'))
      .finally(() => setLoading(false))
  }, [routeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (bus: BusType) => {
    setSelectedBus(bus)
    navigate(`/track/${bus.id}`)
  }

  return (
    <main className="min-h-screen bg-surface-900 pt-20 px-4 pb-10">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate('/routes')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to routes
        </button>

        <div className="mb-8">
          <p className="text-brand-400 text-sm font-medium mb-1">Step 2 of 3</p>
          <h1 className="text-2xl font-bold text-white">Choose a Bus</h1>
          {selectedRoute && (
            <p className="text-slate-400 mt-1 text-sm">
              {selectedRoute.source} → {selectedRoute.destination}
            </p>
          )}
        </div>

        {loading && <div className="flex justify-center py-16"><Spinner /></div>}
        {error && <div className="glass-card p-4 border-red-500/30 text-red-400 text-sm">{error}</div>}

        <div className="space-y-3">
          {buses.map((bus) => (
            <button
              key={bus.id}
              onClick={() => handleSelect(bus)}
              className="glass-card w-full p-5 flex items-center gap-4 hover:border-brand-500/40 hover:bg-surface-700
                         transition-all duration-200 group text-left"
            >
              <div className="w-11 h-11 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center">
                <Bus className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{bus.bus_number}</p>
                <p className="text-xs text-slate-400 mt-0.5">Bus #{bus.id}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors" />
            </button>
          ))}

          {!loading && buses.length === 0 && !error && (
            <div className="glass-card p-8 text-center text-slate-400 text-sm">
              No buses are currently assigned to this route.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
