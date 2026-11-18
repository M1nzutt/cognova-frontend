import { describe, expect, it } from 'vitest'
import { formatDuration } from '../utils/formatDuration'

describe('human-readable session durations', () => {
  it.each([
    ['60.140789', '1 min'],
    ['61.2', '≈ 1 min'],
    ['900', '15 min'],
    ['4800', '1 h 20 min'],
    ['3600', '1 h'],
    ['45.5', '46 s'],
  ])('formats %s seconds as %s without changing source values', (seconds, formatted) => {
    const original = seconds
    expect(formatDuration(seconds)).toBe(formatted)
    expect(seconds).toBe(original)
  })
})
