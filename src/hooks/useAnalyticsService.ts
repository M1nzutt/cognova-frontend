import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { AnalyticsService } from '../services/AnalyticsService'
export function useAnalyticsService(): AnalyticsService {
 const { session } = useAuth()
 return useMemo(() => new AnalyticsService(session.api), [session])
}
