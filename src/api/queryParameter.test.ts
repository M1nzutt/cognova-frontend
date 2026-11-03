import { describe, expect, it } from 'vitest'
import { validQueryParameter } from './queryParameter'

describe('API query parameter allowlist', () => {
  it.each(['activity', 'study_session'])('accepts Calendar type/cursor value %s', value => {
    expect(validQueryParameter('type', value)).toBe(true)
    expect(validQueryParameter('after_type', value)).toBe(true)
  })

  it('rejects unsupported Calendar discriminators', () => {
    expect(validQueryParameter('type', 'personal')).toBe(false)
    expect(validQueryParameter('after_type', 'personal')).toBe(false)
    expect(validQueryParameter('unexpected', 'study_session')).toBe(false)
  })
})
