import type { StudySession, StudySessionSummary, StudySessionWrite } from '../types/studySession'

export const plannedStart = '2030-01-15T15:00:00Z'
export const startedAt = '2030-01-15T15:05:00Z'
export const sessionWrite: StudySessionWrite = { subject_id: 1, activity_id: null, planned_start_at: plannedStart, planned_duration: 45 }
export const sessionSummary: StudySessionSummary = {
  ...sessionWrite, id: 8, execution_state: 'planned', status: null, start_at: null, end_at: null,
  actual_duration: '0.000000', context: null, created_at: startedAt, updated_at: startedAt,
}
export const studySession: StudySession = {
  ...sessionSummary, execution_state: 'running', start_at: startedAt,
  intervals: [{ id: 12, started_at: startedAt, ended_at: null }], other_text: null,
}
