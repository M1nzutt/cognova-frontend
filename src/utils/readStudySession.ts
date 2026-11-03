import { ApiError } from '../api/ApiError'
import { sessionContexts, sessionExecutionStates, sessionResults } from '../types/studySession'
import type { StudySession, StudySessionCursor, StudySessionInterval, StudySessionList, StudySessionSummary } from '../types/studySession'

const invalid = (): never => { throw new ApiError('No pudimos leer tus sesiones. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE') }
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : invalid()
const integer = (value: unknown, min = 1): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= 2147483647
const date = (value: unknown): value is string => typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
const nullableDate = (value: unknown): value is string | null => value === null || date(value)
const decimalSeconds = (value: unknown): value is string => typeof value === 'string' && /^\d+(?:\.\d{1,6})?$/.test(value)

function interval(value: unknown): StudySessionInterval {
  const item = object(value)
  if (!integer(item.id) || !date(item.started_at) || !nullableDate(item.ended_at)
    || item.ended_at !== null && Date.parse(item.ended_at) <= Date.parse(item.started_at)) return invalid()
  return item as unknown as StudySessionInterval
}

export function readStudySessionSummary(value: unknown): StudySessionSummary {
  const item = object(value)
  if (!integer(item.id) || !integer(item.subject_id)
    || !(item.activity_id === null || integer(item.activity_id))
    || !date(item.planned_start_at) || !integer(item.planned_duration, 10) || item.planned_duration > 180
    || !sessionExecutionStates.some(state => state === item.execution_state)
    || !(item.status === null || sessionResults.some(result => result === item.status))
    || !(item.context === null || sessionContexts.some(context => context === item.context))
    || !nullableDate(item.start_at) || !nullableDate(item.end_at)
    || !decimalSeconds(item.actual_duration) || !date(item.created_at) || !date(item.updated_at)
    || item.execution_state === 'finished' && item.status === null
    || item.execution_state !== 'finished' && item.status !== null) return invalid()
  return item as unknown as StudySessionSummary
}

export function readStudySession(value: unknown): StudySession {
  const item = object(value)
  const summary = readStudySessionSummary(item)
  if (!(item.other_text === null || typeof item.other_text === 'string' && [...item.other_text].length <= 200)
    || !Array.isArray(item.intervals)) return invalid()
  const intervals = item.intervals.map(interval)
  if (intervals.filter(row => row.ended_at === null).length > 1
    || intervals.some((row, index) => row.ended_at === null && index !== intervals.length - 1)
    || intervals.some((row, index) => index > 0 && Date.parse(row.started_at) < Date.parse(intervals[index - 1].ended_at ?? intervals[index - 1].started_at))
    || item.context === 'other' && typeof item.other_text !== 'string'
    || item.context !== 'other' && item.other_text !== null
    || summary.start_at === null && intervals.length > 0
    || summary.start_at !== null && intervals.length === 0
    || summary.start_at !== null && intervals[0]?.started_at !== summary.start_at) return invalid()
  return { ...summary, other_text: item.other_text as string | null, intervals }
}

export function readStudySessionList(value: unknown): StudySessionList {
  const item = object(value)
  if (!Array.isArray(item.items) || !(item.next_cursor === null || typeof item.next_cursor === 'object')) return invalid()
  const items = item.items.map(readStudySessionSummary)
  if (items.some((row, index) => index > 0 && (Date.parse(row.planned_start_at) < Date.parse(items[index - 1].planned_start_at)
    || Date.parse(row.planned_start_at) === Date.parse(items[index - 1].planned_start_at) && row.id <= items[index - 1].id))) return invalid()
  let nextCursor: StudySessionCursor | null = null
  if (item.next_cursor !== null) {
    const cursor = object(item.next_cursor)
    if (!date(cursor.after_planned_start_at) || !integer(cursor.after_id)
      || items.length === 0 || cursor.after_planned_start_at !== items.at(-1)?.planned_start_at || cursor.after_id !== items.at(-1)?.id) return invalid()
    nextCursor = { after_planned_start_at: cursor.after_planned_start_at, after_id: cursor.after_id }
  }
  return { items, next_cursor: nextCursor }
}
