export interface Route {
  id: number
  source: string
  destination: string
}

export interface Bus {
  id: number
  route_id: number
  bus_number: string
}

export interface BusStop {
  id: number
  route_id: number
  stop_name: string
  latitude: number
  longitude: number
  stop_order: number
}

export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH'

export interface BusLocation {
  bus_id: number
  bus_number: string
  latitude: number
  longitude: number
  active_passengers: number
  crowd_level: CrowdLevel
  last_updated: string | null
}

export interface StopETA {
  stop_id: number
  stop_name: string
  latitude: number
  longitude: number
  stop_order: number
  distance_km: number
  eta_minutes: number | null
}

export interface ETAResponse {
  bus_id: number
  bus_number: string
  current_latitude: number
  current_longitude: number
  average_speed_kmh: number
  stops: StopETA[]
}

export interface User {
  id: number
  name: string
}

export interface WsBusPayload {
  buses: BusLocation[]
}
