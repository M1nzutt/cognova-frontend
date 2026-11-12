import { ApiError } from '../api/ApiError'
import { activityPriorities, activityStatuses } from '../types/activity'
import { sessionContexts, sessionExecutionStates, sessionResults } from '../types/studySession'
import { challengeStatuses, challengeTargets, planSources, planStatuses } from '../types/studyPlan'
import type { AiPlanGenerationResponse, AiPlanProposalSnapshot, BehaviorAnalysis, BehaviorObservation } from '../types/ai'
import type { CandidateSlot, PlanActivity, PlanBranch, PlanDecision, PlanSession, PlanSubject, StudyChallenge, StudyChallengeList, StudyPlan, StudyPlanList, StudyPlanSummary, WeeklyRhythmEntry } from '../types/studyPlan'

const invalid = (): never => { throw new ApiError('No pudimos leer tus planes. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE') }
const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : invalid()
const integer = (value: unknown, min = 1): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= 2147483647
const date = (value: unknown): value is string =>
  typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
const nullableDate = (value: unknown): value is string | null => value === null || date(value)
const proposalDate = (value: unknown): value is string => {
  if (date(value)) return true
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
const nullableProposalDate = (value: unknown): value is string | null => value === null || proposalDate(value)
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

function readAiSnapshot(value: unknown): AiPlanProposalSnapshot {
  const row = object(value)
  const proposal = object(row.plan)
  if (row.schema_version !== 1 || !text(row.model, 100) || !date(row.generated_at)
    || !text(row.explanation, 2000) || !text(row.reasoning_summary, 2000)
    || !text(proposal.name, 100) || !text(proposal.objective, 2000)
    || !proposalDate(proposal.start_date) || !proposalDate(proposal.end_date)
    || !ids(proposal.subject_ids) || !ids(proposal.activity_ids) || !ids(proposal.session_ids)
    || !Array.isArray(row.proposed_challenges) || row.proposed_challenges.length > 30) return invalid()
  const proposedChallenges = row.proposed_challenges.map(value => {
    const challenge = object(value)
    const nullableId = (id: unknown) => id === null || integer(id)
    if (!text(challenge.title, 100) || !text(challenge.objective, 2000)
      || !text(challenge.explanation, 1000) || !Array.isArray(challenge.evidence)
      || challenge.evidence.length < 1 || challenge.evidence.length > 5
      || challenge.evidence.some(item => !text(item, 1000))
      || !challengeTargets.some(target => target === challenge.target_type)
      || !nullableId(challenge.target_id) || !nullableId(challenge.subject_id)
      || !nullableId(challenge.activity_id) || !nullableId(challenge.session_id)
      || !object(challenge.target_value) || !text(challenge.measurable_condition, 300)
      || !nullableProposalDate(challenge.start_date) || !nullableProposalDate(challenge.end_date)) return invalid()
    return challenge
  })
  return { ...row, plan: proposal, proposed_challenges: proposedChallenges } as unknown as AiPlanProposalSnapshot
}

function readBehaviorObservation(value: unknown): BehaviorObservation {
  const row = object(value)
  const evidence = row.evidence
  if (!text(row.observation, 1000) || !Array.isArray(evidence) || evidence.length < 1 || evidence.length > 5
    || evidence.some(item => !text(item, 1000)) || !text(row.question, 500)
    || !text(row.confidence_basis, 500) || !ids(row.related_subject_ids)
    || !ids(row.related_activity_ids) || !ids(row.related_session_ids)) return invalid()
  return row as unknown as BehaviorObservation
}

export function readAiPlanGeneration(value: unknown): AiPlanGenerationResponse {
  const row = object(value)
  if (!text(row.explanation, 2000) || !text(row.reasoning_summary, 2000)) return invalid()
  const plan = readPlan(row.plan)
  if (plan.source !== 'ai' || plan.status !== 'draft' || !plan.ai_proposal_snapshot
    || plan.ai_proposal_snapshot.explanation !== row.explanation
    || plan.ai_proposal_snapshot.reasoning_summary !== row.reasoning_summary) return invalid()
  return { plan, explanation: row.explanation, reasoning_summary: row.reasoning_summary }
}

export function readBehaviorAnalysis(value: unknown): BehaviorAnalysis {
  const row = object(value)
  if (!integer(row.finished_session_count, 0) || typeof row.pattern_eligible !== 'boolean'
    || row.pattern_eligible !== (row.finished_session_count >= 5)
    || !Array.isArray(row.observations) || row.observations.length > 5) return invalid()
  return { finished_session_count: row.finished_session_count, pattern_eligible: row.pattern_eligible,
    observations: row.observations.map(readBehaviorObservation) }
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
  const snapshot = row.ai_proposal_snapshot === undefined || row.ai_proposal_snapshot === null
    ? null : readAiSnapshot(row.ai_proposal_snapshot)
  return { ...row, ai_proposal_snapshot: snapshot } as unknown as StudyPlan
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
