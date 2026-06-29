import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, ArrowRight, Radio, Users, Zap } from 'lucide-react'
import { createUser } from '../services/api'
import { useAppStore } from '../context/store'
import { Spinner } from '../components/ui/Spinner'

const features = [
  {
    icon: Radio,
    title: 'Live Crowdsourcing',
    desc: 'Passengers share GPS — together they pinpoint the bus.',
  },
  {
    icon: Zap,
    title: 'Real-time ETA',
    desc: 'Distance + speed gives you accurate arrival predictions.',
  },
  {
    icon: Users,
    title: 'Crowd Level',
    desc: 'Know before you board: Low, Moderate, or High.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAppStore()
  const [name, setName] = useState(user?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setError('')
    setLoading(true)
    try {
      const u = await createUser(name.trim())
      setUser(u)
      navigate('/routes')
    } catch {
      setError('Could not connect to server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  // If already identified, skip name entry
  useEffect(() => {
    if (user) navigate('/routes')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-surface-900 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <div className="w-20 h-20 bg-brand-500/20 border border-brand-500/30 rounded-3xl flex items-center justify-center mb-8 animate-pulse-slow">
          <Bus className="w-10 h-10 text-brand-400" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Where Is<br />
          <span className="text-brand-400">My Bus?</span>
        </h1>
        <p className="text-slate-400 max-w-md text-lg mb-12">
          Crowdsourced real-time tracking. No hardware needed —
          passengers power the map.
        </p>

        {/* Name entry card */}
        <div className="glass-card p-6 w-full max-w-sm space-y-4 animate-slide-up">
          <label className="block text-sm font-medium text-slate-300">
            Your name to get started
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="e.g. Arjun Banerjee"
            className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder:text-slate-500
                       focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleStart}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size="sm" /> : (
              <>Track a Bus <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-t border-surface-700 px-4 py-10">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-5 space-y-2">
              <Icon className="w-6 h-6 text-brand-400" />
              <h3 className="font-semibold text-white text-sm">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
