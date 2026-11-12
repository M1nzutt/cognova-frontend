import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from './client'

describe('API error metadata', () => {
  it('preserves Retry-After while keeping provider details private', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 'GEMINI_RATE_LIMIT', message: 'private provider detail' } }), {
      status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '30' },
    })))
    const client = new ApiClient('/api/v1', () => null, vi.fn())
    const promise = client.request('/analysis/behavior', { method: 'POST' })
    await expect(promise).rejects.toMatchObject({ code: 'GEMINI_RATE_LIMIT', status: 503, retryAfterSeconds: 30 })
    await expect(promise).rejects.not.toHaveProperty('message', 'private provider detail')
  })

  it('converts HTTP-date Retry-After to a bounded delay', async () => {
    const retryDate = new Date(Date.now() + 8_000).toUTCString()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 'GEMINI_RATE_LIMIT' } }), {
      status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': retryDate },
    })))
    const client = new ApiClient('/api/v1', () => null, vi.fn())
    await expect(client.request('/analysis/behavior', { method: 'POST' })).rejects.toMatchObject({ retryAfterSeconds: expect.any(Number) })
  })

  it('marks a provider request timeout without exposing the transport error', async () => {
    const expired = new AbortController()
    expired.abort()
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(expired.signal)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('private transport detail') }))
    const client = new ApiClient('/api/v1', () => null, vi.fn())
    await expect(client.request('/analysis/behavior', { method: 'POST' })).rejects.toMatchObject({ code: 'TIMEOUT', status: 0 })
  })
})
