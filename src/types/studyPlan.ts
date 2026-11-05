import type { ActivityPriority, ActivityStatus } from './activity'
import type { SessionContext, SessionExecutionState, SessionResult } from './studySession'

export const planStatuses = ['draft', 'active', 'completed', 'abandoned'] as const
export const planSources = ['ai', 'manual'] as const
export const challengeStatuses = ['pending', 'in_progress', 'completed', 'failed', 'cancelled'] as const
export const challengeTargets = ['study_minutes', 'activity_completion', 'session_completion', 'subject_mastery', 'custom'] as const

export type PlanStatus = typeof planStatuses[number]
export type PlanSource = typeof planSources[number]
export type ChallengeStatus = typeof challengeStatuses[number]
export type ChallengeTarget = typeof challengeTargets[number]

export interface StudyPlanWrite {
  name: string
  objective: string
  start_at: string
  end_at: string
  subject_ids: number[]
  activity_ids: number[]
  study_session_ids: number[]
}
export interface StudyPlanSummary {
  id: number
  name: string
  objective: string
  start_at: string
  end_at: string
  status: PlanStatus
  source: PlanSource
  created_at: string
  updated_at: string
}
export interface PlanSubject { id: number; name: string }
export interface PlanActivity {
  id: number; subject_id: number; title: string; deadline: string
  priority: ActivityPriority; status: ActivityStatus; estimated_duration: number
}
export interface PlanSession {
  id: number; subject_id: number; activity_id: number | null
  planned_start_at: string; planned_duration: number
  execution_state: SessionExecutionState; status: SessionResult | null
  start_at: string | null; end_at: string | null; actual_duration: string
  context: SessionContext | null
}
export interface PlanDecision {
  id: number
  action: 'accepted' | 'edited' | 'rejected' | 'regenerated'
  field_path: string | null
  proposed_value: unknown
  chosen_value: unknown
  created_at: string
}
export interface PlanBranch {
  key: string
  kind: 'plan' | 'subject' | 'activity' | 'study_session' | 'challenge'
  label: string
  children: PlanBranch[]
}
export interface WeeklyRhythmEntry { weekday: number; name: string; planned_minutes: number }
export interface CandidateSlot { start_at: string; end_at: string; duration_minutes: number }
export interface StudyPlan extends StudyPlanSummary {
  subjects: PlanSubject[]
  activities: PlanActivity[]
  study_sessions: PlanSession[]
  decisions: PlanDecision[]
  challenge_count: number
  hierarchy: PlanBranch
  priority_order: number[]
  activity_dependency_order: number[]
  weekly_rhythm: WeeklyRhythmEntry[]
  candidate_slots: CandidateSlot[]
  schedule_conflict: boolean
}
export interface StudyPlanList { items: StudyPlanSummary[]; next_after_id: number | null }

export interface StudyChallengeWrite {
  subject_id: number | null
  activity_id: number | null
  study_session_id: number | null
  title: string
  description: string
  target_type: ChallengeTarget
  target_value: Record<string, unknown>
  start_at: string | null
  deadline: string | null
  generation_criteria: Record<string, unknown>
  depends_on_activity_ids: number[]
}
export interface StudyChallenge extends Omit<StudyChallengeWrite, 'depends_on_activity_ids'> {
  id: number
  plan_id: number
  status: ChallengeStatus
  source: PlanSource
  created_at: string
  updated_at: string
}
export interface StudyChallengeList { items: StudyChallenge[]; next_after_id: number | null }
