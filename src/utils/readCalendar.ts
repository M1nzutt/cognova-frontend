import { ApiError } from '../api/ApiError'
import { activityPriorities, activityStatuses } from '../types/activity'
import { sessionExecutionStates, sessionResults } from '../types/studySession'
import type { CalendarActivity, CalendarCursor, CalendarItem, CalendarItemType, CalendarMixedPage, CalendarPage, CalendarStudySession } from '../types/calendar'

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
export function calendarItemInstant(item: CalendarItem) {
  return instantMicros(item.type === 'activity' ? item.deadline : item.planned_start_at)
}
const typeRank = (type: CalendarItemType) => type === 'activity' ? 0 : 1
export function compareCalendarItems(a: CalendarItem, b: CalendarItem) {
  const delta = calendarItemInstant(a) - calendarItemInstant(b)
  if (delta) return delta < 0 ? -1 : 1
  const typeDelta = typeRank(a.type) - typeRank(b.type)
  return typeDelta || a.id - b.id
}
export function compareCalendarItemCursor(item: CalendarItem, cursor: CalendarCursor) {
  const delta = calendarItemInstant(item) - instantMicros(cursor.after_deadline)
  if (delta) return delta < 0 ? -1 : 1
  const typeDelta = typeRank(item.type) - typeRank(cursor.after_type)
  return typeDelta || item.id - cursor.after_id
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
function readStudySession(value: unknown): CalendarStudySession {
  const v = object(value)
  if (!id(v.id) || !id(v.subject_id) || v.type !== 'study_session'
    || !(v.activity_id === null || id(v.activity_id))
    || !id(v.planned_duration) || v.planned_duration < 10 || v.planned_duration > 180
    || !sessionExecutionStates.some(state => state === v.lifecycle)
    || !(v.result === null || sessionResults.some(result => result === v.result))
    || !(v.start_at === null || typeof v.start_at === 'string')
    || !(v.end_at === null || typeof v.end_at === 'string')) return calendarInvalid()
  instantMicros(v.planned_start_at)
  if (v.start_at !== null) instantMicros(v.start_at)
  if (v.end_at !== null) instantMicros(v.end_at)
  return v as unknown as CalendarStudySession
}
function readCalendarItem(value: unknown): CalendarItem {
  const item = object(value)
  if (item.type === 'activity') return readItem(item)
  if (item.type === 'study_session') return readStudySession(item)
  return calendarInvalid()
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

export function readMixedCalendar(value: unknown): CalendarMixedPage {
  const v = object(value)
  if (!Array.isArray(v.items)) return calendarInvalid()
  const items = v.items.map(readCalendarItem)
  if (items.some((item, i) => i > 0 && compareCalendarItems(items[i - 1], item) >= 0)) return calendarInvalid()
  if (v.next_cursor === null) return { items, next_cursor: null }
  const cursorValue = object(v.next_cursor), last = items.at(-1)
  if (!id(cursorValue.after_id) || !last) return calendarInvalid()
  instantMicros(cursorValue.after_deadline)
  const afterType = cursorValue.after_type ?? 'activity'
  if (afterType !== 'activity' && afterType !== 'study_session') return calendarInvalid()
  const cursor: CalendarCursor = {
    after_deadline: cursorValue.after_deadline as string,
    after_type: afterType,
    after_id: cursorValue.after_id,
  }
  if (compareCalendarItemCursor(last, cursor) !== 0) return calendarInvalid()
  return { items, next_cursor: cursor }
}
