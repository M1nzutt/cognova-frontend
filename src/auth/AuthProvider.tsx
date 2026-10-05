import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './AuthContext'
import { AuthSession } from './AuthSession'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session] = useState(() => new AuthSession(import.meta.env.VITE_API_BASE_URL || '/api/v1'))
  useEffect(() => session.start(), [session])
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
}
