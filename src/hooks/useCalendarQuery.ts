import { useSearchParams } from 'react-router-dom'
import { activityPriorities, activityStatuses } from '../types/activity'
import type { CalendarFilterType, CalendarFilters, CalendarView } from '../types/calendar'
import { dayKey, parseDay } from '../utils/calendarDates'
export function useCalendarQuery() {
  const [params, setParams] = useSearchParams()
  const date = parseDay(params.get('date')), view: CalendarView = params.get('view') === 'week' ? 'week' : 'month'
  const rawType = params.get('type'), type: CalendarFilterType = rawType === 'activity' || rawType === 'study_session' ? rawType : 'all'
  const filters: CalendarFilters = { type }
  const subject = Number(params.get('subject_id')), status = params.get('status'), priority = params.get('priority')
  if (Number.isSafeInteger(subject) && subject > 0 && subject <= 2147483647) filters.subject_id = subject
  if (type !== 'study_session') {
    if (activityStatuses.some(s => s === status)) filters.status = status as CalendarFilters['status']
    if (activityPriorities.some(p => p === priority)) filters.priority = priority as CalendarFilters['priority']
  }
  const update = (nextDate: Date, nextView: CalendarView, nextFilters: CalendarFilters) => {
    const next = new URLSearchParams({ date: dayKey(nextDate), view: nextView })
    for (const [key, value] of Object.entries(nextFilters)) if (value !== undefined && !(key === 'type' && value === 'all')) next.set(key, String(value))
    setParams(next)
  }
  return {
    date,
    view,
    filters,
    onDate: (d: Date) => update(d, view, filters),
    onView: (v: CalendarView) => update(date, v, filters),
    onFilters: (nextFilters: CalendarFilters) => {
      const normalized = { ...nextFilters, type: nextFilters.type ?? 'all' as const }
      if (normalized.type === 'study_session') {
        delete normalized.status
        delete normalized.priority
      }
      update(date, view, normalized)
    },
  }
}
