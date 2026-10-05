import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SessionGate } from '../components/SessionGate'

export function ProtectedRoute() {
  const { status } = useAuth()
  return <SessionGate>{status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />}</SessionGate>
}
