import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Route, Bus, BusStop, BusLocation, ETAResponse, User } from '../types'

interface AppState {
  // ── Session ──────────────────────────────────────────────────────────────
  user: User | null
  setUser: (u: User) => void

  // ── Selection ─────────────────────────────────────────────────────────────
  selectedRoute: Route | null
  setSelectedRoute: (r: Route) => void

  selectedBus: Bus | null
  setSelectedBus: (b: Bus) => void

  // ── Data ──────────────────────────────────────────────────────────────────
  stops: BusStop[]
  setStops: (s: BusStop[]) => void

  busLocation: BusLocation | null
  setBusLocation: (l: BusLocation) => void

  etaData: ETAResponse | null
  setEtaData: (e: ETAResponse | null) => void

  // ── Tracking state ───────────────────────────────────────────────────────
  isTracking: boolean
  setIsTracking: (v: boolean) => void

  userCoords: GeolocationCoordinates | null
  setUserCoords: (c: GeolocationCoordinates) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      selectedRoute: null,
      setSelectedRoute: (selectedRoute) => set({ selectedRoute }),

      selectedBus: null,
      setSelectedBus: (selectedBus) => set({ selectedBus }),

      stops: [],
      setStops: (stops) => set({ stops }),

      busLocation: null,
      setBusLocation: (busLocation) => set({ busLocation }),

      etaData: null,
      setEtaData: (etaData) => set({ etaData }),

      isTracking: false,
      setIsTracking: (isTracking) => set({ isTracking }),

      userCoords: null,
      setUserCoords: (userCoords) => set({ userCoords }),
    }),
    {
      name: 'wimb-store',
      partialize: (s) => ({ user: s.user }),  // only persist user session
    }
  )
)
