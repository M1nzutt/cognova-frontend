import { describe, expect, it } from 'vitest'
import { effectiveSeconds, formatDuration, studySessionError } from './studySessionPresentation'
import { studySession } from '../test/studySessionFixtures'
import { ApiError } from '../api/ApiError'

describe('study session presentation', () => {
  it('animates only an open running interval on top of server-confirmed time', () => {
    expect(effectiveSeconds({ ...studySession, actual_duration: '120.000000' }, Date.parse(studySession.start_at!) + 5000)).toBe(125)
    expect(effectiveSeconds({ ...studySession, execution_state: 'paused', actual_duration: '120.000000' }, Date.now())).toBe(120)
  })
  it('formats effective time accessibly', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(3661)).toBe('1:01:01')
  })
  it('uses safe messages for server conflicts without exposing codes', () => {
    expect(studySessionError(new ApiError('private', 409, 'DATABASE_ERROR'))).toContain('otra en curso')
    expect(studySessionError(new Error('private response'))).not.toContain('private response')
  })
})
