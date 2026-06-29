import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/ui/Navbar'
import HomePage from './pages/HomePage'
import RoutesPage from './pages/RoutesPage'
import BusesPage from './pages/BusesPage'
import TrackingPage from './pages/TrackingPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"                            element={<HomePage />} />
        <Route path="/routes"                      element={<RoutesPage />} />
        <Route path="/routes/:routeId/buses"       element={<BusesPage />} />
        <Route path="/track/:busId"                element={<TrackingPage />} />
        <Route path="/dashboard"                   element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}
