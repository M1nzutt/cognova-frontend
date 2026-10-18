import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function OnboardingRoute() {
  const { destination } = useAuth()
  const { pathname } = useLocation()
  return pathname === destination ? <Outlet /> : <Navigate to={destination} replace />
}
