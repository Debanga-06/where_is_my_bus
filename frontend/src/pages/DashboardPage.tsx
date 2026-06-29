import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, MapPin, TrendingUp, Users, Activity } from 'lucide-react'
import { getRoutes, getBusesForRoute, getBusLocation } from '../services/api'
import { useAppStore } from '../context/store'
import { CrowdBadge } from '../components/ui/CrowdBadge'
import { Spinner } from '../components/ui/Spinner'
import type { Route, Bus as BusType, BusLocation } from '../types'

interface RouteSummary {
  route: Route
  buses: BusType[]
  locations: BusLocation[]
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [summaries, setSummaries] = useState<RouteSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/'); return }

    const load = async () => {
      const routes = await getRoutes()
      const result: RouteSummary[] = []

      for (const route of routes) {
        const buses = await getBusesForRoute(route.id)
        const locations = await Promise.all(
          buses.map((b) => getBusLocation(b.id).catch(() => null))
        )
        result.push({
          route,
          buses,
          locations: locations.filter(Boolean) as BusLocation[],
        })
      }
      setSummaries(result)
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalBuses = summaries.reduce((a, s) => a + s.buses.length, 0)
  const activeBuses = summaries.reduce((a, s) => a + s.locations.length, 0)
  const totalPassengers = summaries.reduce(
    (a, s) => a + s.locations.reduce((b, l) => b + l.active_passengers, 0),
    0
  )

  return (
    <main className="min-h-screen bg-surface-900 pt-20 px-4 pb-10">
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Fleet Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">Live overview of all routes and buses.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Bus, label: 'Total Buses', value: totalBuses, color: 'text-brand-400' },
            { icon: Activity, label: 'Active Now', value: activeBuses, color: 'text-emerald-400' },
            { icon: Users, label: 'Passengers Reporting', value: totalPassengers, color: 'text-amber-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card p-5">
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <p className="text-2xl font-extrabold text-white">{loading ? '—' : value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="space-y-6">
            {summaries.map(({ route, buses, locations }) => (
              <div key={route.id} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <h2 className="font-semibold text-white">
                    {route.source} → {route.destination}
                  </h2>
                  <span className="ml-auto text-xs text-slate-500">{buses.length} buses</span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {buses.map((bus) => {
                    const loc = locations.find((l) => l.bus_id === bus.id)
                    return (
                      <button
                        key={bus.id}
                        onClick={() => navigate(`/track/${bus.id}`)}
                        className="bg-surface-700 hover:bg-surface-600 border border-surface-600 hover:border-brand-500/40
                                   rounded-xl p-3 flex items-center gap-3 transition text-left group"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                          ${loc ? 'bg-brand-500/20 border border-brand-500/30' : 'bg-surface-600 border border-surface-500'}`}>
                          <Bus className={`w-4 h-4 ${loc ? 'text-brand-400' : 'text-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm">{bus.bus_number}</p>
                          {loc ? (
                            <CrowdBadge
                              level={loc.crowd_level}
                              count={loc.active_passengers}
                              className="mt-1 text-xs px-2 py-0.5"
                            />
                          ) : (
                            <p className="text-xs text-slate-500 mt-0.5">No data</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
