import type { ActivityPriority, ActivityStatus } from './activity'

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
export interface CalendarCursor { after_deadline: string; after_id: number }
export interface CalendarPage { items: CalendarActivity[]; next_cursor: CalendarCursor | null }
export interface CalendarFilters { subject_id?: number; status?: ActivityStatus; priority?: ActivityPriority }
export interface CalendarQuery extends CalendarFilters { deadline_from: string; deadline_to: string }
export type CalendarView = 'month' | 'week'
