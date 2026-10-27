import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from '../api/client'
import { CalendarService } from './CalendarService'
import { calendarItem as item, calendarQuery as query } from '../test/calendarFixtures'
import { jsonResponse } from '../test/authFixtures'
const service = () => new CalendarService(new ApiClient('/api/v1', () => 'memory', vi.fn()))
describe('Calendar API', () => {
  it('sends authenticated no-store GET with filters and paired cursor', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ items: [item], next_cursor: null }))
    vi.stubGlobal('fetch', fetch)
    await service().page({ ...query, subject_id: 1, status: 'pending', priority: 'high' }, { after_deadline: query.deadline_from, after_id: 2 })
    const [url, options] = fetch.mock.calls[0], q = new URL(url, 'https://test').searchParams
    expect(q.get('after_deadline')).toBe(query.deadline_from); expect(q.get('after_id')).toBe('2')
    expect(q.get('subject_id')).toBe('1'); expect(q.get('status')).toBe('pending'); expect(q.get('priority')).toBe('high')
    expect(options).toMatchObject({ method: 'GET', cache: 'no-store', credentials: 'include' })
    expect(options.headers.get('Authorization')).toBe('Bearer memory'); expect(options.body).toBeUndefined()
  })
  it('loads all pages preserving microsecond ordering and cursor text', async () => {
    const a = { ...item, id: 9, deadline: '2030-01-15T15:00:00.000001Z' }, b = { ...item, id: 2, deadline: '2030-01-15T15:00:00.000002Z' }
    const cursor = { after_deadline: a.deadline, after_id: a.id }
    const fetch = vi.fn().mockResolvedValueOnce(jsonResponse({ items: [a], next_cursor: cursor })).mockResolvedValueOnce(jsonResponse({ items: [b], next_cursor: null }))
    vi.stubGlobal('fetch', fetch)
    expect(await service().all(query, new AbortController().signal)).toEqual([a,b])
    expect(new URL(fetch.mock.calls[1][0], 'https://test').searchParams.get('after_deadline')).toBe(a.deadline)
  })
  it.each([
    { ...query, deadline_to: query.deadline_from },
    { deadline_from: '2030-01-01T00:00:00Z', deadline_to: '2031-01-03T00:00:00Z' },
  ])('rejects empty or oversized ranges before HTTP', async bad => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    await expect(service().page(bad)).rejects.toMatchObject({ status: 422 }); expect(fetch).not.toHaveBeenCalled()
  })
  it.each([
    { items: [{ ...item, type: 'personal' }], next_cursor: null },
    { items: [{ ...item, status: 'secret' }], next_cursor: null },
    { items: [{ ...item, deadline: query.deadline_to }], next_cursor: null },
    { items: [item, item], next_cursor: null },
    { items: [], next_cursor: { after_deadline: item.deadline, after_id: 1 } },
    { items: [item], next_cursor: { after_deadline: item.deadline, after_id: 2 } },
  ])('rejects invalid response, order, cursor or upper boundary', async body => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body)))
    await expect(service().all(query, new AbortController().signal)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
  it('rejects repeated pages rather than looping', async () => {
    const fetch = vi.fn().mockImplementation(async () => jsonResponse({ items: [item], next_cursor: { after_deadline: item.deadline, after_id: item.id } }))
    vi.stubGlobal('fetch', fetch)
    await expect(service().all(query, new AbortController().signal)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' }); expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('rejects a moved duplicate across pages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ items: [item], next_cursor: { after_deadline: item.deadline, after_id: item.id } })).mockResolvedValueOnce(jsonResponse({ items: [{ ...item, deadline: '2030-01-16T15:00:00Z' }], next_cursor: null })))
    await expect(service().all(query, new AbortController().signal)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
  it('aborts without making a request', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); const c = new AbortController(); c.abort()
    await expect(service().all(query, c.signal)).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled()
  })
  it.each([403,422,503])('preserves HTTP %s without exposing backend text', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'ERROR', message: 'private SQL' } }, status)))
    await expect(service().page(query)).rejects.toMatchObject({ status })
    await expect(service().page(query)).rejects.not.toThrow('private SQL')
  })
})
