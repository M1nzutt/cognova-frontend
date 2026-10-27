import { ApiError } from '../api/ApiError'
import { activityPriorities, activityStatuses } from '../types/activity'
import type { CalendarActivity, CalendarPage } from '../types/calendar'

export const calendarInvalid = (): never => { throw new ApiError('No pudimos leer tu calendario. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE') }
const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : calendarInvalid()
const id = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0 && v <= 2147483647
export function instantMicros(v: unknown): bigint {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(v) || !Number.isFinite(Date.parse(v))) return calendarInvalid()
  const fraction = (v.match(/\.(\d+)/)?.[1] ?? '').padEnd(6, '0')
  return BigInt(Date.parse(v)) * 1000n + BigInt(fraction.slice(3))
}
export function compareCalendar(a: Pick<CalendarActivity, 'deadline' | 'id'>, b: Pick<CalendarActivity, 'deadline' | 'id'>) {
  const delta = instantMicros(a.deadline) - instantMicros(b.deadline)
  return delta < 0 ? -1 : delta > 0 ? 1 : a.id - b.id
}
function readItem(value: unknown): CalendarActivity {
  const v = object(value)
  if (!id(v.id) || !id(v.subject_id) || v.type !== 'activity'
    || typeof v.title !== 'string' || !v.title.trim() || [...v.title].length > 50
    || !activityPriorities.some(p => p === v.priority) || !activityStatuses.some(s => s === v.status)
    || !id(v.estimated_duration) || v.estimated_duration < 10 || v.estimated_duration > 300) return calendarInvalid()
  instantMicros(v.deadline); instantMicros(v.original_deadline)
  return v as unknown as CalendarActivity
}
export function readCalendar(value: unknown): CalendarPage {
  const v = object(value)
  if (!Array.isArray(v.items)) return calendarInvalid()
  const items = v.items.map(readItem)
  if (items.some((item, i) => i > 0 && compareCalendar(items[i - 1], item) >= 0)) return calendarInvalid()
  if (v.next_cursor === null) return { items, next_cursor: null }
  const cursor = object(v.next_cursor), last = items.at(-1)
  if (!id(cursor.after_id) || !last || cursor.after_id !== last.id || instantMicros(cursor.after_deadline) !== instantMicros(last.deadline)) return calendarInvalid()
  return { items, next_cursor: { after_id: cursor.after_id, after_deadline: cursor.after_deadline as string } }
}
