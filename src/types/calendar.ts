import type { ActivityPriority, ActivityStatus } from './activity'
import type { SessionExecutionState, SessionResult } from './studySession'

export interface CalendarActivity {
  id: number
  type: 'activity'
  title: string
  subject_id: number
  deadline: string
  original_deadline: string
  priority: ActivityPriority
  status: ActivityStatus
  estimated_duration: number
}
export interface CalendarStudySession {
  id: number
  type: 'study_session'
  subject_id: number
  activity_id: number | null
  planned_start_at: string
  planned_duration: number
  lifecycle: SessionExecutionState
  result: SessionResult | null
  start_at: string | null
  end_at: string | null
}
export type CalendarItemType = CalendarActivity['type'] | CalendarStudySession['type']
export type CalendarFilterType = 'all' | CalendarItemType
export type CalendarItem = CalendarActivity | CalendarStudySession
export interface CalendarCursor { after_deadline: string; after_type: CalendarItemType; after_id: number }
export interface CalendarLegacyCursor { after_deadline: string; after_id: number }
export interface CalendarPage { items: CalendarActivity[]; next_cursor: CalendarLegacyCursor | null }
export interface CalendarMixedPage { items: CalendarItem[]; next_cursor: CalendarCursor | null }
export interface CalendarFilters { subject_id?: number; status?: ActivityStatus; priority?: ActivityPriority }
export interface CalendarQuery extends CalendarFilters { deadline_from: string; deadline_to: string }
export type CalendarView = 'month' | 'week'
