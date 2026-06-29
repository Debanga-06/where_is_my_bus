import { Clock, MapPin, Gauge } from 'lucide-react'
import type { ETAResponse } from '../../types'

interface Props {
  eta: ETAResponse
}

export function ETACard({ eta }: Props) {
  const next = eta.stops[0]

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm">Upcoming Stops</h3>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Gauge className="w-3.5 h-3.5 text-brand-400" />
          {eta.average_speed_kmh} km/h
        </span>
      </div>

      {/* Next stop hero */}
      {next && (
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-400 rounded-full mt-0.5 flex-shrink-0" />
              <span className="font-medium text-white text-sm">{next.stop_name}</span>
            </div>
            {next.eta_minutes !== null && (
              <span className="flex items-center gap-1 text-brand-400 font-bold text-sm whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" />
                {next.eta_minutes < 1 ? 'Arriving' : `${Math.round(next.eta_minutes)} min`}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 ml-4">{next.distance_km.toFixed(1)} km away</p>
        </div>
      )}

      {/* Remaining stops list */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
        {eta.stops.slice(1).map((stop) => (
          <div key={stop.stop_id} className="flex items-center justify-between gap-2 px-1 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="text-xs text-slate-300 truncate">{stop.stop_name}</span>
            </div>
            {stop.eta_minutes !== null && (
              <span className="text-xs text-slate-400 whitespace-nowrap">
                ~{Math.round(stop.eta_minutes)} min
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
