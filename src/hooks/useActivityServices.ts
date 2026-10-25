import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { ActivityService } from '../services/ActivityService'
import { SubjectService } from '../services/SubjectService'
import type { Subject } from '../types/subject'
export function useActivityServices() {
  const { session } = useAuth()
  return useMemo(() => {
    const service = new ActivityService(session.api), subjects = new SubjectService(session.api)
    return { service, async loadSubjects(signal: AbortSignal) {
      const items: Subject[] = []; let cursor: number | undefined
      do { signal.throwIfAborted(); const page = await subjects.list('all', cursor, signal); items.push(...page.items); if (page.next_after_id !== null && cursor !== undefined && page.next_after_id <= cursor) throw new Error('Invalid cursor'); cursor = page.next_after_id ?? undefined } while (cursor)
      return items
    } }
  }, [session])
}
