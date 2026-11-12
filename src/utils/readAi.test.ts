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

  it('allows factual low-history analysis but rejects an inconsistent eligibility threshold', () => {
    const lowHistory = { finished_session_count: 3, pattern_eligible: false, observations: [] }
    expect(readBehaviorAnalysis(lowHistory).observations).toEqual([])
    expect(readBehaviorAnalysis(behaviorFixture).pattern_eligible).toBe(true)
    expect(() => readBehaviorAnalysis({ ...lowHistory, pattern_eligible: true })).toThrow()
  })
})
