import { describe, expect, it } from 'vitest'
import { aiPlanFixture, aiProposalFixture, behaviorFixture } from '../test/studyPlanSetup'
import { readAiPlanGeneration, readBehaviorAnalysis } from './readStudyPlan'

describe('AI contract readers', () => {
  it('accepts the persisted draft proposal response', () => {
    const result = readAiPlanGeneration({ plan: aiPlanFixture, explanation: aiProposalFixture.explanation, reasoning_summary: aiProposalFixture.reasoning_summary })
    expect(result.plan.status).toBe('draft')
    expect(result.plan.ai_proposal_snapshot?.proposed_challenges[0].evidence).toEqual(['Hay una actividad de biología vinculada.'])
  })

  it('rejects a generation response without an AI snapshot and draft status', () => {
    expect(() => readAiPlanGeneration({ plan: { ...aiPlanFixture, ai_proposal_snapshot: null }, explanation: aiProposalFixture.explanation, reasoning_summary: aiProposalFixture.reasoning_summary })).toThrow()
    expect(() => readAiPlanGeneration({ plan: { ...aiPlanFixture, status: 'active' }, explanation: aiProposalFixture.explanation, reasoning_summary: aiProposalFixture.reasoning_summary })).toThrow()
  })

  it('accepts factual observations without a minimum-pattern threshold', () => {
    const lowHistory = { completed_session_count: 0, reviewed_session_count: 0, state: 'insufficient_data', insufficient_data_guidance: 'Faltan registros.', observations: [] }
    expect(readBehaviorAnalysis(lowHistory).observations).toEqual([])
    expect(readBehaviorAnalysis(behaviorFixture).state).toBe('factual_summary')
    expect(() => readBehaviorAnalysis({ ...lowHistory, completed_session_count: 1 })).toThrow()
    expect(() => readBehaviorAnalysis({ ...behaviorFixture, observations: [{ ...behaviorFixture.observations[0], related_resources: [
      ...behaviorFixture.observations[0].related_resources,
      behaviorFixture.observations[0].related_resources[0],
    ] }] })).toThrow()
    expect(() => readBehaviorAnalysis({ ...behaviorFixture, observations: [{ ...behaviorFixture.observations[0], related_resources:
      behaviorFixture.observations[0].related_resources.filter(resource => resource.kind !== 'session') }] })).toThrow()
  })
})
