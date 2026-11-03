export const sessionExecutionStates = ['planned', 'running', 'paused', 'finished'] as const
export const sessionResults = ['completed', 'partial', 'postponed', 'cancelled'] as const
export const sessionContexts = ['finished_early', 'distracted', 'tired', 'interrupted', 'changed_activity', 'other'] as const

export type SessionExecutionState = typeof sessionExecutionStates[number]
export type SessionResult = typeof sessionResults[number]
export type SessionContext = typeof sessionContexts[number]

export interface StudySessionWrite {
  subject_id: number
  activity_id: number | null
  planned_start_at: string
  planned_duration: number
}

export interface StudySessionInterval {
  id: number
  started_at: string
  ended_at: string | null
}

export interface StudySessionSummary {
  id: number
  subject_id: number
  activity_id: number | null
  planned_start_at: string
  planned_duration: number
  execution_state: SessionExecutionState
  status: SessionResult | null
  start_at: string | null
  end_at: string | null
  actual_duration: string
  context: SessionContext | null
  created_at: string
  updated_at: string
}

export interface StudySession extends StudySessionSummary {
  other_text: string | null
  intervals: StudySessionInterval[]
}

export interface StudySessionCursor {
  after_planned_start_at: string
  after_id: number
}

export interface StudySessionList {
  items: StudySessionSummary[]
  next_cursor: StudySessionCursor | null
}

export interface StudySessionFilters {
  subject_id?: number
  activity_id?: number
  execution_state?: SessionExecutionState
  status?: SessionResult
  planned_start_from?: string
  planned_start_to?: string
}

export interface StudySessionFinish {
  status: SessionResult
  context: SessionContext | null
  other_text: string | null
}
