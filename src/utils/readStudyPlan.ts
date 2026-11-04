import { ApiError } from '../api/ApiError'
import { activityPriorities, activityStatuses } from '../types/activity'
import { sessionContexts, sessionExecutionStates, sessionResults } from '../types/studySession'
import { challengeStatuses, challengeTargets, planSources, planStatuses } from '../types/studyPlan'
import type { CandidateSlot, PlanActivity, PlanBranch, PlanDecision, PlanSession, PlanSubject, StudyChallenge, StudyChallengeList, StudyPlan, StudyPlanList, StudyPlanSummary, WeeklyRhythmEntry } from '../types/studyPlan'

const invalid = (): never => { throw new ApiError('No pudimos leer tus planes. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE') }
const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : invalid()
const integer = (value: unknown, min = 1): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= 2147483647
const date = (value: unknown): value is string =>
  typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
const nullableDate = (value: unknown): value is string | null => value === null || date(value)
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && [...value].length <= max
const ids = (value: unknown): value is number[] => Array.isArray(value) && value.every(row => integer(row))

export function readPlanSummary(value: unknown): StudyPlanSummary {
  const row = object(value)
  if (!integer(row.id) || !text(row.name, 100) || !text(row.objective, 2000)
    || !date(row.start_at) || !date(row.end_at) || Date.parse(row.end_at) <= Date.parse(row.start_at)
    || !planStatuses.some(status => status === row.status)
    || !planSources.some(source => source === row.source)
    || !date(row.created_at) || !date(row.updated_at)) return invalid()
  return row as unknown as StudyPlanSummary
}

export function readPlanList(value: unknown): StudyPlanList {
  const row = object(value)
  if (!Array.isArray(row.items) || !(row.next_after_id === null || integer(row.next_after_id))) return invalid()
  const items = row.items.map(readPlanSummary)
  if (items.some((item, index) => index > 0 && item.id <= items[index - 1].id)
    || row.next_after_id !== null && row.next_after_id !== items.at(-1)?.id) return invalid()
  return { items, next_after_id: row.next_after_id as number | null }
}

function readBranch(value: unknown, depth = 0): PlanBranch {
  const row = object(value)
  if (depth > 6 || !text(row.key, 100) || !text(row.label, 200)
    || !['plan', 'subject', 'activity', 'study_session', 'challenge'].includes(String(row.kind))
    || !Array.isArray(row.children)) return invalid()
  return { key: row.key, kind: row.kind as PlanBranch['kind'], label: row.label, children: row.children.map(child => readBranch(child, depth + 1)) }
}

function readSubject(value: unknown): PlanSubject {
  const row = object(value)
  if (!integer(row.id) || !text(row.name, 20)) return invalid()
  return row as unknown as PlanSubject
}

function readActivity(value: unknown): PlanActivity {
  const row = object(value)
  if (!integer(row.id) || !integer(row.subject_id) || !text(row.title, 50)
    || !date(row.deadline) || !integer(row.estimated_duration, 10)
    || !activityPriorities.some(priority => priority === row.priority)
    || !activityStatuses.some(status => status === row.status)) return invalid()
  return row as unknown as PlanActivity
}

function readSession(value: unknown): PlanSession {
  const row = object(value)
  if (!integer(row.id) || !integer(row.subject_id) || !(row.activity_id === null || integer(row.activity_id))
    || !date(row.planned_start_at) || !integer(row.planned_duration, 10)
    || !sessionExecutionStates.some(state => state === row.execution_state)
    || !(row.status === null || sessionResults.some(status => status === row.status))
    || !nullableDate(row.start_at) || !nullableDate(row.end_at)
    || !(typeof row.actual_duration === 'string' && /^\d+(?:\.\d{1,6})?$/.test(row.actual_duration))
    || !(row.context === null || sessionContexts.some(context => context === row.context))) return invalid()
  return row as unknown as PlanSession
}

function readDecision(value: unknown): PlanDecision {
  const row = object(value)
  if (!integer(row.id) || !['accepted', 'edited', 'rejected', 'regenerated'].includes(String(row.action))
    || !(row.field_path === null || typeof row.field_path === 'string')
    || !('proposed_value' in row) || !('chosen_value' in row) || !date(row.created_at)) return invalid()
  return row as unknown as PlanDecision
}

function readRhythm(value: unknown): WeeklyRhythmEntry {
  const row = object(value)
  if (!integer(row.weekday, 0) || row.weekday > 6 || !text(row.name, 30)
    || !integer(row.planned_minutes, 0)) return invalid()
  return row as unknown as WeeklyRhythmEntry
}

function readSlot(value: unknown): CandidateSlot {
  const row = object(value)
  if (!date(row.start_at) || !date(row.end_at) || Date.parse(row.end_at) <= Date.parse(row.start_at)
    || !integer(row.duration_minutes)) return invalid()
  return row as unknown as CandidateSlot
}

export function readPlan(value: unknown): StudyPlan {
  const row = object(value)
  readPlanSummary(row)
  if (!Array.isArray(row.subjects) || !Array.isArray(row.activities) || !Array.isArray(row.study_sessions)
    || !Array.isArray(row.decisions) || !integer(row.challenge_count, 0)
    || !ids(row.priority_order) || !ids(row.activity_dependency_order)
    || !Array.isArray(row.weekly_rhythm) || !Array.isArray(row.candidate_slots)
    || typeof row.schedule_conflict !== 'boolean') return invalid()
  row.subjects.map(readSubject)
  row.activities.map(readActivity)
  row.study_sessions.map(readSession)
  row.decisions.map(readDecision)
  row.weekly_rhythm.map(readRhythm)
  row.candidate_slots.map(readSlot)
  const hierarchy = readBranch(row.hierarchy)
  if (hierarchy.kind !== 'plan') return invalid()
  return row as unknown as StudyPlan
}

export function readChallenge(value: unknown): StudyChallenge {
  const row = object(value)
  if (!integer(row.id) || !integer(row.plan_id)
    || !(row.subject_id === null || integer(row.subject_id))
    || !(row.activity_id === null || integer(row.activity_id))
    || !(row.study_session_id === null || integer(row.study_session_id))
    || !text(row.title, 100) || !text(row.description, 2000)
    || !challengeTargets.some(target => target === row.target_type)
    || !challengeStatuses.some(status => status === row.status)
    || !planSources.some(source => source === row.source)
    || !nullableDate(row.start_at) || !nullableDate(row.deadline)
    || !date(row.created_at) || !date(row.updated_at)) return invalid()
  object(row.target_value)
  object(row.generation_criteria)
  return row as unknown as StudyChallenge
}

export function readChallengeList(value: unknown): StudyChallengeList {
  const row = object(value)
  if (!Array.isArray(row.items) || !(row.next_after_id === null || integer(row.next_after_id))) return invalid()
  const items = row.items.map(readChallenge)
  if (items.some((item, index) => index > 0 && item.id <= items[index - 1].id)
    || row.next_after_id !== null && row.next_after_id !== items.at(-1)?.id) return invalid()
  return { items, next_after_id: row.next_after_id as number | null }
}
