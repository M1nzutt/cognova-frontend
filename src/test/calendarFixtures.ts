import type { CalendarActivity } from '../types/calendar'
export const calendarItem: CalendarActivity = {
  id: 1, type: 'activity', title: 'Preparar ensayo', subject_id: 1,
  deadline: '2030-01-15T15:00:00Z', original_deadline: '2030-01-14T15:00:00Z',
  priority: 'high', status: 'pending', estimated_duration: 45,
}
export const calendarQuery = { deadline_from: '2030-01-01T00:00:00Z', deadline_to: '2030-02-01T00:00:00Z' }
