import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, ChevronRight } from 'lucide-react'
import { getRoutes } from '../services/api'
import { useAppStore } from '../context/store'
import { Spinner } from '../components/ui/Spinner'
import type { Route } from '../types'

export default function RoutesPage() {
  const navigate = useNavigate()
  const { user, setSelectedRoute } = useAppStore()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/'); return }
    getRoutes()
      .then(setRoutes)
      .catch(() => setError('Failed to load routes. Check server connection.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (route: Route) => {
    setSelectedRoute(route)
    navigate(`/routes/${route.id}/buses`)
  }

  return (
    <main className="min-h-screen bg-surface-900 pt-20 px-4 pb-10">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="mb-8">
          <p className="text-brand-400 text-sm font-medium mb-1">Step 1 of 3</p>
          <h1 className="text-2xl font-bold text-white">Choose a Route</h1>
          <p className="text-slate-400 mt-1 text-sm">Select the route you're travelling on.</p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {error && (
          <div className="glass-card p-4 border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        <div className="space-y-3">
          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => handleSelect(route)}
              className="glass-card w-full p-5 flex items-center gap-4 hover:border-brand-500/40 hover:bg-surface-700
                         transition-all duration-200 group text-left"
            >
              <div className="flex-1 flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-brand-400 rounded-full" />
                  <div className="w-0.5 h-8 bg-surface-500" />
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                </div>
                <div>
                  <p className="font-semibold text-white">{route.source}</p>
                  <p className="text-xs text-slate-500 my-1 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Route {route.id}
                  </p>
                  <p className="font-semibold text-emerald-300">{route.destination}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
