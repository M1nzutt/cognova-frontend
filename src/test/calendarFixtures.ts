import type { CalendarActivity, CalendarStudySession } from '../types/calendar'
import type { StudySession } from '../types/studySession'
import type { Subject } from '../types/subject'
export const calendarItem: CalendarActivity = {
  id: 1, type: 'activity', title: 'Preparar ensayo', subject_id: 1,
  deadline: '2030-01-15T15:00:00Z', original_deadline: '2030-01-14T15:00:00Z',
  priority: 'high', status: 'pending', estimated_duration: 45,
}
export const calendarSession: CalendarStudySession = {
  id: 1, type: 'study_session', subject_id: 1, activity_id: null,
  planned_start_at: '2030-01-15T15:00:00Z', planned_duration: 45,
  lifecycle: 'planned', result: null, start_at: null, end_at: null,
}
export const finishedCalendarSession: CalendarStudySession = {
  ...calendarSession, id: 2, lifecycle: 'finished', result: 'partial',
  start_at: '2030-01-15T15:02:00Z', end_at: '2030-01-15T15:25:00Z',
}
export const calendarSessionDetail: StudySession = {
  id: calendarSession.id, subject_id: calendarSession.subject_id, activity_id: null,
  planned_start_at: calendarSession.planned_start_at, planned_duration: calendarSession.planned_duration,
  execution_state: 'planned', status: null, start_at: null, end_at: null,
  actual_duration: '0.000000', context: null, created_at: calendarSession.planned_start_at,
  updated_at: calendarSession.planned_start_at, intervals: [], other_text: null,
}
export const calendarSubject: Subject = {
  id:1, name:'Álgebra', status:'active', difficulty:'medium', color_base:'blue', color_shade:200,
  created_at:calendarSession.planned_start_at, updated_at:calendarSession.planned_start_at,
}
export const calendarQuery = { deadline_from: '2030-01-01T00:00:00Z', deadline_to: '2030-02-01T00:00:00Z' }
