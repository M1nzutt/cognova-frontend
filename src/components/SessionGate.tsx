import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

export function SessionGate({ children }: { children: ReactNode }) {
  const { status, loggingOut } = useAuth()
  if (status === 'loading') return <p role="status">Comprobando tu sesión…</p>
  if (loggingOut) return <p role="status">Cerrando tu sesión en el servidor…</p>
  return children
}
