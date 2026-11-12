import type { ChallengeTarget } from './studyPlan'

export interface AiProposedPlan {
  name: string
  objective: string
  start_date: string
  end_date: string
  subject_ids: number[]
  activity_ids: number[]
  session_ids: number[]
}

export interface AiProposedChallenge {
  title: string
  objective: string
  explanation: string
  evidence: string[]
  target_type: ChallengeTarget
  target_id: number | null
  subject_id: number | null
  activity_id: number | null
  session_id: number | null
  target_value: Record<string, unknown>
  measurable_condition: string
  start_date: string | null
  end_date: string | null
}

export interface AiPlanProposalSnapshot {
  schema_version: 1
  model: string
  generated_at: string
  explanation: string
  reasoning_summary: string
  plan: AiProposedPlan
  proposed_challenges: AiProposedChallenge[]
}

export interface AiPlanGenerationResponse {
  plan: import('./studyPlan').StudyPlan
  explanation: string
  reasoning_summary: string
}

export interface BehaviorObservation {
  observation: string
  evidence: string[]
  question: string
  confidence_basis: string
  related_subject_ids: number[]
  related_activity_ids: number[]
  related_session_ids: number[]
}

export interface BehaviorAnalysis {
  finished_session_count: number
  pattern_eligible: boolean
  observations: BehaviorObservation[]
}
