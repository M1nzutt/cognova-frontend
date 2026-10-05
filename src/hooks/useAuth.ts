import { useContext, useSyncExternalStore } from 'react'
import { AuthContext } from '../auth/AuthContext'

export function useAuth() {
  const session = useContext(AuthContext)
  if (!session) throw new Error('useAuth requires AuthProvider')
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot)
  return { ...state, session }
}
