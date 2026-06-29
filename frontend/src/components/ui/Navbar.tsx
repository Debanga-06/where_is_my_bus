import { Bus, MapPin } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../../context/store'

export function Navbar() {
  const location = useLocation()
  const user = useAppStore((s) => s.user)
  const route = useAppStore((s) => s.selectedRoute)

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-900/80 backdrop-blur-md border-b border-surface-600">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center group-hover:bg-brand-600 transition-colors">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Where Is My Bus
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {route && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 bg-surface-700 px-3 py-1.5 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              <span>{route.source} → {route.destination}</span>
            </div>
          )}
          {user && (
            <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center text-xs font-bold text-brand-100">
              {user.name[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
