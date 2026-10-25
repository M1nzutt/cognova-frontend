import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from '../api/client'
import { ActivityService } from './ActivityService'
import { jsonResponse } from '../test/authFixtures'
import { activity, activityBody } from '../test/activityFixtures'
import { activityError, toInstant, localDate } from '../utils/activityPresentation'
const service = () => new ActivityService(new ApiClient('/api/v1', () => 'memory', vi.fn()))
describe('Activities API contract', () => {
  it('sends exact write fields, preconditions and explicit DELETE', async () => {
    const fetch = vi.fn().mockImplementation(async () => jsonResponse(activity)); vi.stubGlobal('fetch', fetch)
    const api = service()
    await api.create(activity); await api.update(1, activity); await api.status(1, 'completed', 'pending'); await api.deadline(1, activity.deadline, 0)
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 })); await api.remove(1, true)
    expect(fetch.mock.calls.map(c => c[1].method)).toEqual(['POST', 'PUT', 'PATCH', 'PATCH', 'DELETE'])
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(activityBody)
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ status: 'completed', expected_status: 'pending' })
    expect(JSON.parse(fetch.mock.calls[3][1].body)).toEqual({ deadline: activity.deadline, expected_revision: 0 })
    expect(fetch.mock.calls[4][0]).toBe('/api/v1/activities/1?confirm=true')
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'include', cache: 'no-store' })
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer memory')
  })
  it('encodes all filters, offsets and cursors without query injection', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ items: [activity], next_after_id: null })); vi.stubGlobal('fetch', fetch)
    await service().list({ subject_id: 1, status: 'in_progress', priority: 'urgent', deadline: '2030-01-01T10:00:00-05:00', deadline_from: activity.deadline, deadline_to: activity.deadline }, 2)
    const q = new URL(fetch.mock.calls[0][0], 'https://test').searchParams
    expect(q.get('deadline')).toBe('2030-01-01T10:00:00-05:00'); expect(q.get('after_id')).toBe('2'); expect(q.get('priority')).toBe('urgent')
    await expect(service().list({ status: 'pending&limit=100' as 'pending' })).rejects.toMatchObject({ code: 'INVALID_QUERY' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('reads history cursor and validates event direction', async () => {
    const event = { revision: 1, previous_deadline: activity.deadline, new_deadline: '2030-01-02T15:00:00Z', event_type: 'postponed', occurred_at: activity.created_at }
    const fetch = vi.fn().mockResolvedValueOnce(jsonResponse({ items: [event], next_after_revision: 1 })).mockResolvedValueOnce(jsonResponse({ items: [{ ...event, event_type: 'rescheduled' }], next_after_revision: null })); vi.stubGlobal('fetch', fetch)
    expect((await service().history(1, 2)).items).toEqual([event]); expect(fetch.mock.calls[0][0]).toContain('after_revision=2')
    await expect(service().history(1)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
  it.each([404, 409, 422, 503])('preserves errors %s and drafts without retrying writes or leaking messages', async status => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'ACTIVITY_ERROR', message: 'private SQL secret' } }, status)); vi.stubGlobal('fetch', fetch)
    try { await service().create(activityBody); throw new Error('Expected failure') } catch (error) { expect(error).toMatchObject({ status }); expect(activityError(error)).not.toContain('secret') }
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('rejects invalid IDs and unconfirmed deletion before requests', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    await expect(service().detail(NaN)).rejects.toMatchObject({ status: 404 })
    await expect(service().remove(1, false as true)).rejects.toThrow('Confirma'); expect(fetch).not.toHaveBeenCalled()
  })
  it.each([{ ...activity, status: 'unknown' }, { ...activity, estimated_duration: 301 }, { ...activity, original_deadline: 'yesterday' }, { ...activity, notes: 'x'.repeat(201) }])('rejects malformed responses', async value => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(value)))
    await expect(service().detail(1)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
  it('converts local dates explicitly and rejects invalid calendar dates', () => {
    expect(localDate(toInstant('2030-01-01T12:34'))).toBe('2030-01-01T12:34')
    expect(() => toInstant('2030-02-30T12:00')).toThrow(); expect(() => toInstant('')).toThrow()
  })
})
