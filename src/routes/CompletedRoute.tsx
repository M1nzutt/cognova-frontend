import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function CompletedRoute() {
  const { user, destination } = useAuth()
  return user?.onboarding.next_step === 'complete' ? <Outlet /> : <Navigate to={destination} replace />
}
