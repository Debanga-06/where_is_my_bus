import axios from 'axios'
import type { Route, Bus, BusStop, BusLocation, ETAResponse, User } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
})

export const getRoutes = (): Promise<Route[]> =>
  api.get<Route[]>('/routes').then((r) => r.data)

export const getBusesForRoute = (routeId: number): Promise<Bus[]> =>
  api.get<Bus[]>(`/routes/${routeId}/buses`).then((r) => r.data)

export const getStopsForRoute = (routeId: number): Promise<BusStop[]> =>
  api.get<BusStop[]>(`/routes/${routeId}/stops`).then((r) => r.data)

export const postLocation = (payload: {
  user_id: number
  bus_id: number
  latitude: number
  longitude: number
}): Promise<void> => api.post('/location', payload).then(() => undefined)

export const getBusLocation = (busId: number): Promise<BusLocation> =>
  api.get<BusLocation>(`/bus/${busId}/location`).then((r) => r.data)

export const getBusETA = (busId: number): Promise<ETAResponse> =>
  api.get<ETAResponse>(`/bus/${busId}/eta`).then((r) => r.data)

export const createUser = (name: string): Promise<User> =>
  api.post<User>('/users/', { name }).then((r) => r.data)
