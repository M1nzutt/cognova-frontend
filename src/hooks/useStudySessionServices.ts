import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { ActivityService } from '../services/ActivityService'
import { SubjectService } from '../services/SubjectService'
import { StudySessionService } from '../services/StudySessionService'
import type { Activity } from '../types/activity'
import type { Subject } from '../types/subject'

export function useStudySessionServices() {
  const { session } = useAuth()
  return useMemo(() => {
    const sessions = new StudySessionService(session.api)
    const activities = new ActivityService(session.api)
    const subjects = new SubjectService(session.api)
    return {
      sessions,
      async loadSubjects(signal: AbortSignal): Promise<Subject[]> {
        const result: Subject[] = []
        let cursor: number | undefined
        do {
          signal.throwIfAborted()
          const page = await subjects.list('all', cursor, signal)
          result.push(...page.items)
          if (page.next_after_id !== null && cursor !== undefined && page.next_after_id <= cursor) throw new Error('Invalid cursor')
          cursor = page.next_after_id ?? undefined
        } while (cursor)
        return result
      },
      async loadActivities(subjectId: number, signal: AbortSignal): Promise<Activity[]> {
        const result: Activity[] = []
        let cursor: number | undefined
        do {
          signal.throwIfAborted()
          const page = await activities.list({ subject_id: subjectId }, cursor, signal)
          result.push(...page.items)
          if (page.next_after_id !== null && cursor !== undefined && page.next_after_id <= cursor) throw new Error('Invalid cursor')
          cursor = page.next_after_id ?? undefined
        } while (cursor)
        return result
      },
    }
  }, [session])
}
