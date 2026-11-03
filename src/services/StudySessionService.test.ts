import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from '../api/client'
import { jsonResponse } from '../test/authFixtures'
import { sessionSummary, sessionWrite, studySession } from '../test/studySessionFixtures'
import { StudySessionService } from './StudySessionService'

const service = () => new StudySessionService(new ApiClient('/api/v1', () => 'memory-token', vi.fn()))

describe('Study sessions API contract', () => {
  it('sends planning, transition, finish, and confirmed delete requests through the shared client', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(studySession, 201))
      .mockResolvedValueOnce(jsonResponse(studySession))
      .mockResolvedValueOnce(jsonResponse(studySession))
      .mockResolvedValueOnce(jsonResponse({ ...studySession, execution_state: 'finished', status: 'partial', context: 'other', other_text: 'Interrupción familiar', end_at: '2030-01-15T15:30:00Z', actual_duration: '1500.000000', intervals: [{ id: 12, started_at: studySession.start_at, ended_at: '2030-01-15T15:30:00Z' }] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const api = service()
    await api.create(sessionWrite)
    await api.update(8, { ...sessionWrite, activity_id: 11 })
    await api.transition(8, 'pause')
    await api.finish(8, { status: 'partial', context: 'other', other_text: 'Interrupción familiar' })
    await api.remove(8, true)

    expect(fetchMock.mock.calls.map(call => [new URL(call[0], 'https://test').pathname, call[1].method])).toEqual([
      ['/api/v1/sessions', 'POST'], ['/api/v1/sessions/8', 'PUT'], ['/api/v1/sessions/8/pause', 'POST'],
      ['/api/v1/sessions/8/finish', 'POST'], ['/api/v1/sessions/8', 'DELETE'],
    ])
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(sessionWrite)
    expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({ status: 'partial', context: 'other', other_text: 'Interrupción familiar' })
    expect(new URL(fetchMock.mock.calls[4][0], 'https://test').searchParams.get('confirm')).toBe('true')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include', cache: 'no-store' })
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer memory-token')
  })

  it('sends filters and both cursor fields, preserving the chronological cursor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      items: [sessionSummary], next_cursor: { after_planned_start_at: sessionSummary.planned_start_at, after_id: sessionSummary.id },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const filters = { subject_id: 1, activity_id: 2, execution_state: 'paused' as const, status: 'partial' as const, planned_start_from: '2030-01-01T00:00:00Z' }
    await service().list(filters, { after_planned_start_at: sessionSummary.planned_start_at, after_id: sessionSummary.id })
    const query = new URL(fetchMock.mock.calls[0][0], 'https://test').searchParams
    expect(query.get('execution_state')).toBe('paused')
    expect(query.get('status')).toBe('partial')
    expect(query.get('planned_start_from')).toBe(filters.planned_start_from)
    expect(query.get('after_planned_start_at')).toBe(sessionSummary.planned_start_at)
    expect(query.get('after_id')).toBe('8')
    expect(query.get('limit')).toBe('50')
  })

  it('recovers a running session from the server after refresh', async () => {
    const running = { ...studySession, execution_state: 'running' as const }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ items: [{ ...running, intervals: undefined }], next_cursor: null }))
      .mockResolvedValueOnce(jsonResponse(running))
      .mockResolvedValueOnce(jsonResponse({ items: [], next_cursor: null }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await service().listActive()).toMatchObject({ id: 8, execution_state: 'running' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('rejects invalid identifiers and unconfirmed deletion before the network call', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(service().detail(0)).rejects.toMatchObject({ status: 404 })
    await expect(service().remove(8, false as true)).rejects.toThrow('Confirma')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([404, 409, 422, 503])('preserves safe typed HTTP status %s', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'INTERNAL_DB_ERROR', message: 'private database detail' } }, status)))
    try { await service().transition(8, 'start'); throw new Error('Expected failure') }
    catch (error) { expect(error).toMatchObject({ status }); expect(String(error)).not.toContain('private database detail') }
  })
})
