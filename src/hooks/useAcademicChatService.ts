import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { AcademicChatService } from '../services/AcademicChatService'

export function useAcademicChatService(): AcademicChatService {
  const { session } = useAuth()
  return useMemo(() => new AcademicChatService(session.api), [session])
}
