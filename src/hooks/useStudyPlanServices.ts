import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { useStudySessionServices } from './useStudySessionServices'
import { StudyPlanService } from '../services/StudyPlanService'
import { StudyChallengeService } from '../services/StudyChallengeService'
import type { Activity } from '../types/activity'
import type { StudySessionSummary, StudySessionCursor } from '../types/studySession'

export function useStudyPlanServices() {
  const { session } = useAuth()
  const existing = useStudySessionServices()
  return useMemo(() => ({
    plans: new StudyPlanService(session.api),
    challenges: new StudyChallengeService(session.api),
    loadSubjects: existing.loadSubjects,
    async loadChoices(signal: AbortSignal) {
      const subjects = await existing.loadSubjects(signal)
      const activities: Activity[] = []
      for (const subject of subjects) {
        signal.throwIfAborted()
        activities.push(...await existing.loadActivities(subject.id, signal))
      }
      const sessions: StudySessionSummary[] = []
      let cursor: StudySessionCursor | undefined
      do {
        signal.throwIfAborted()
        const page = await existing.sessions.list({}, cursor, signal)
        sessions.push(...page.items)
        cursor = page.next_cursor ?? undefined
      } while (cursor)
      return { subjects, activities, sessions }
    },
  }), [existing, session])
}
