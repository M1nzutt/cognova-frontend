import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from '../api/client'
import { QuestionnaireService } from './QuestionnaireService'
import { catalog, response } from '../test/questionnaireFixtures'
import { jsonResponse } from '../test/authFixtures'

const service = () => new QuestionnaireService(new ApiClient('/api/v1', () => 'access-in-memory', vi.fn()))
describe('questionnaire service', () => {
  it('loads catalog with Bearer and cookies', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(catalog)); vi.stubGlobal('fetch', fetch)
    expect(await service().catalog()).toEqual(catalog)
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/questionnaire/catalog')
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-in-memory')
    expect(fetch.mock.calls[0][1].credentials).toBe('include')
  })
  it('distinguishes absent initial response from other errors', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(jsonResponse({ error: { code: 'QUESTIONNAIRE_NOT_FOUND' } }, 404))
      .mockResolvedValueOnce(jsonResponse({ error: { code: 'NOT_FOUND' } }, 404)).mockResolvedValueOnce(jsonResponse(response))
    vi.stubGlobal('fetch', fetch)
    expect(await service().current()).toBeNull()
    await expect(service().current()).rejects.toMatchObject({ status: 404 })
    expect(await service().current()).toEqual(response)
  })
  it('creates and appends revisions using exact payloads', async () => {
    const fetch = vi.fn().mockImplementation(async () => jsonResponse(response)); vi.stubGlobal('fetch', fetch)
    const initial = { questionnaire_version: 1 as const, answers: response.answers }
    await service().create(initial)
    await service().update({ ...initial, expected_revision: 1 })
    expect(fetch.mock.calls.map(c => c[1].method)).toEqual(['POST', 'PUT'])
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(initial)
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ ...initial, expected_revision: 1 })
  })
  it('preserves the conflict code and never automatically repeats writes', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'QUESTIONNAIRE_VERSION_CONFLICT' } }, 409)); vi.stubGlobal('fetch', fetch)
    await expect(service().update({ questionnaire_version: 1, answers: response.answers, expected_revision: 1 })).rejects.toMatchObject({ code: 'QUESTIONNAIRE_VERSION_CONFLICT', status: 409 })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('encodes history cursor and supports empty pages', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ items: [], next_before_revision: null })); vi.stubGlobal('fetch', fetch)
    expect(await service().history(4)).toEqual({ items: [], next_before_revision: null })
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/questionnaire/history?limit=20&before_revision=4')
    await expect(service().history(-1)).rejects.toMatchObject({ code: 'INVALID_QUERY' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('rejects malformed responses without rendering arbitrary server text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ questions: [] })))
    await expect(service().catalog()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})
