import { ApiError } from '../api/ApiError'
import { activityPriorities, activityStatuses } from '../types/activity'
import type { Activity, ActivityList, DeadlineEvent, DeadlineHistory } from '../types/activity'
const invalid = (): never => { throw new ApiError('No pudimos leer tus actividades. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE') }
const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : invalid()
const integer = (v: unknown, min = 1): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= 2147483647
const date = (v: unknown) => typeof v === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v))
export function readActivity(value: unknown): Activity {
  const v = object(value)
  if (!integer(v.id) || !integer(v.subject_id) || typeof v.title !== 'string' || !v.title.trim() || [...v.title].length > 50
    || !activityStatuses.some(s => s === v.status) || !activityPriorities.some(p => p === v.priority)
    || !integer(v.estimated_duration, 10) || v.estimated_duration > 300 || !integer(v.deadline_revision, 0)
    || !(v.notes === null || typeof v.notes === 'string' && [...v.notes].length <= 200)
    || ![v.deadline, v.original_deadline, v.created_at, v.updated_at].every(date)) return invalid()
  return v as unknown as Activity
}
export function readActivityList(value: unknown): ActivityList {
  const v = object(value)
  if (!Array.isArray(v.items) || !(v.next_after_id === null || integer(v.next_after_id))) return invalid()
  const items = v.items.map(readActivity)
  if (items.some((r, i) => i > 0 && r.id <= items[i-1].id) || v.next_after_id !== null && v.next_after_id !== items.at(-1)?.id) return invalid()
  return { items, next_after_id: v.next_after_id as number | null }
}
function event(value: unknown): DeadlineEvent {
  const v = object(value)
  if (!integer(v.revision) || ![v.previous_deadline, v.new_deadline, v.occurred_at].every(date)
    || !(v.event_type === 'postponed' && Date.parse(String(v.new_deadline)) > Date.parse(String(v.previous_deadline)) || v.event_type === 'rescheduled' && Date.parse(String(v.new_deadline)) < Date.parse(String(v.previous_deadline)))) return invalid()
  return v as unknown as DeadlineEvent
}
export function readDeadlineHistory(value: unknown): DeadlineHistory {
  const v = object(value)
  if (!Array.isArray(v.items) || !(v.next_after_revision === null || integer(v.next_after_revision))) return invalid()
  const items = v.items.map(event)
  if (items.some((r, i) => i > 0 && r.revision <= items[i-1].revision) || v.next_after_revision !== null && v.next_after_revision !== items.at(-1)?.revision) return invalid()
  return { items, next_after_revision: v.next_after_revision as number | null }
}
