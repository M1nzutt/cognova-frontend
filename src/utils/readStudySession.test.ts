import { describe, expect, it } from 'vitest'
import { readStudySession, readStudySessionList, readStudySessionSummary } from './readStudySession'
import { sessionSummary, studySession } from '../test/studySessionFixtures'

describe('study session response validation', () => {
  it('reads a plan and a running session with an open interval', () => {
    expect(readStudySessionSummary(sessionSummary).execution_state).toBe('planned')
    expect(readStudySession(studySession).intervals[0].ended_at).toBeNull()
  })

  it('accepts the finished result and custom context shape', () => {
    expect(readStudySession({
      ...studySession, execution_state: 'finished', status: 'partial', end_at: '2030-01-15T15:30:00Z',
      actual_duration: '1500.000000', context: 'other', other_text: 'Me cambié de espacio',
      intervals: [{ id: 12, started_at: studySession.start_at, ended_at: '2030-01-15T15:20:00Z' }, { id: 13, started_at: '2030-01-15T15:25:00Z', ended_at: '2030-01-15T15:30:00Z' }],
    }).intervals).toHaveLength(2)
  })

  it.each([
    { ...sessionSummary, planned_duration: 9 },
    { ...sessionSummary, planned_start_at: 'mañana' },
    { ...sessionSummary, execution_state: 'finished', status: null },
    { ...studySession, context: 'other', other_text: null },
    { ...studySession, context: 'tired', other_text: 'texto incompatible' },
    { ...studySession, execution_state: 'finished', status: 'partial', end_at: '2030-01-15T15:30:00Z' },
    { ...studySession, intervals: [{ id: 12, started_at: studySession.start_at, ended_at: null }, { id: 13, started_at: '2030-01-15T15:10:00Z', ended_at: null }] },
  ])('rejects malformed response fields', value => {
    expect(() => readStudySession(value)).toThrow()
  })

  it('validates chronological order and matching pagination cursor', () => {
    const later = { ...sessionSummary, id: 9, planned_start_at: '2030-01-16T15:00:00Z' }
    expect(readStudySessionList({ items: [sessionSummary, later], next_cursor: { after_planned_start_at: later.planned_start_at, after_id: later.id } }).items).toHaveLength(2)
    expect(() => readStudySessionList({ items: [later, sessionSummary], next_cursor: null })).toThrow()
    expect(() => readStudySessionList({ items: [sessionSummary], next_cursor: { after_planned_start_at: later.planned_start_at, after_id: later.id } })).toThrow()
  })
})
