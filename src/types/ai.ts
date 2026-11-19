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
  conclusion: string
  observation: string
  interpretation: string
  uncertainty: string
  suggestion: string
  interpretation_source: 'gemini' | 'factual_fallback'
  evidence: BehaviorEvidence[]
  question: string
  confidence_basis: string
  related_resources: BehaviorRelatedResource[]
}

export interface BehaviorEvidence {
  session_id: number
  planned_minutes: number
  actual_seconds: string
  result: 'completed' | 'partial'
  summary: string
}

export interface BehaviorRelatedResource {
  kind: 'subject' | 'activity' | 'session'
  id: number
  label: string
  href: string
}

export interface BehaviorAnalysis {
  completed_session_count: number
  reviewed_session_count: number
  state: 'factual_summary' | 'insufficient_data'
  insufficient_data_guidance: string
  observations: BehaviorObservation[]
}
