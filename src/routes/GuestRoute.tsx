import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SessionGate } from '../components/SessionGate'

export function GuestRoute() {
  const { status, destination } = useAuth()
  return <SessionGate>{status === 'authenticated' ? <Navigate to={destination} replace /> : <Outlet />}</SessionGate>
}
