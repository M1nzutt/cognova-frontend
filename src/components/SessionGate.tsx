import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LoadingStatus } from './LoadingStatus'

export function SessionGate({ children }: { children: ReactNode }) {
  const { status, loggingOut } = useAuth()
  if (status === 'loading') return <LoadingStatus label="Comprobando tu sesión…" />
  if (loggingOut) return <LoadingStatus label="Cerrando tu sesión en el servidor…" />
  return children
}
