import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from '../api/client'
import { SubjectService } from './SubjectService'
import { jsonResponse } from '../test/authFixtures'
const item = { id: 1, name: 'Álgebra', difficulty: 'medium', color_base: 'blue', color_shade: 200, status: 'active', created_at: '2026-10-20T00:00:00Z', updated_at: '2026-10-20T00:00:00Z' }
const body = { name: item.name, difficulty: 'medium' as const, color_base: item.color_base, color_shade: item.color_shade }
const create = () => new SubjectService(new ApiClient('/api/v1', () => 'memory', vi.fn()))
describe('Subjects API contract', () => {
  it('reads remote catalog and cursor pages with session credentials', async () => {
    const catalog = { version: 1, color_bases: ['blue'], color_shades: [200] }
    const fetch = vi.fn().mockResolvedValueOnce(jsonResponse(catalog)).mockResolvedValueOnce(jsonResponse({ items: [item], next_after_id: 1 }))
    vi.stubGlobal('fetch', fetch)
    expect(await create().catalog()).toEqual(catalog)
    expect((await create().list('archived', 3)).next_after_id).toBe(1)
    expect(fetch.mock.calls[1][0]).toBe('/api/v1/subjects?status=archived&limit=20&after_id=3')
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer memory')
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'include', cache: 'no-store' })
  })
  it('uses exact methods and explicit deletion without body', async () => {
    const fetch = vi.fn().mockImplementation(async () => jsonResponse(item)); vi.stubGlobal('fetch', fetch)
    const api = create()
    await api.create(body); await api.detail(1); await api.update(1, body); await api.archive(1); await api.reactivate(1)
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await api.remove(1, true)
    expect(fetch.mock.calls.map(c => c[1].method)).toEqual(['POST', 'GET', 'PUT', 'POST', 'POST', 'DELETE'])
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual(body)
    expect(fetch.mock.calls[5][0]).toBe('/api/v1/subjects/1?confirm=true')
    expect(fetch.mock.calls[5][1].body).toBeUndefined()
  })
  it('rejects invalid ids and confirmation before sending', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    await expect(create().detail(NaN)).rejects.toMatchObject({ status: 404 })
    await expect(create().remove(1, false as true)).rejects.toThrow('Confirma')
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([404, 409, 422, 503])('preserves status %s without retrying writes or server messages', async status => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'SUBJECT_ERROR', message: 'secret stack' } }, status)); vi.stubGlobal('fetch', fetch)
    await expect(create().create(body)).rejects.toMatchObject({ status })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it.each([{ items: [{}], next_after_id: null }, { items: [item], next_after_id: 9 }])('rejects malformed lists', async response => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(response)))
    await expect(create().list('active')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
  it('rejects malformed catalogs and query injection', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ version: 1, color_bases: [], color_shades: [] })); vi.stubGlobal('fetch', fetch)
    await expect(create().catalog()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
    await expect(create().list('active&limit=100' as 'active')).rejects.toMatchObject({ code: 'INVALID_QUERY' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
