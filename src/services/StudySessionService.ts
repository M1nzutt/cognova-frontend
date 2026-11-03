import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import { readStudySession, readStudySessionList } from '../utils/readStudySession'
import type { SessionExecutionState, StudySession, StudySessionCursor, StudySessionFilters, StudySessionFinish, StudySessionList, StudySessionWrite } from '../types/studySession'

const path = (id: number) => {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new ApiError('No encontramos esta sesión.', 404, 'STUDY_SESSION_NOT_FOUND')
  return `/sessions/${id}`
}

const writable = (value: StudySessionWrite): StudySessionWrite => ({
  subject_id: value.subject_id,
  activity_id: value.activity_id,
  planned_start_at: value.planned_start_at,
  planned_duration: value.planned_duration,
})

export class StudySessionService {
  constructor(private readonly client: ApiClient) {}

  async list(filters: StudySessionFilters = {}, cursor?: StudySessionCursor, signal?: AbortSignal): Promise<StudySessionList> {
    return readStudySessionList(await this.client.request('/sessions', {
      signal,
      query: {
        ...filters,
        limit: 50,
        ...(cursor ? { after_planned_start_at: cursor.after_planned_start_at, after_id: cursor.after_id } : {}),
      },
    }))
  }

  async listActive(signal?: AbortSignal): Promise<StudySession | null> {
    const active: StudySession[] = []
    for (const execution_state of ['running', 'paused'] as const satisfies readonly SessionExecutionState[]) {
      let cursor: StudySessionCursor | undefined
      do {
        signal?.throwIfAborted()
        const page = await this.list({ execution_state }, cursor, signal)
        for (const summary of page.items) active.push(await this.detail(summary.id, signal))
        cursor = page.next_cursor ?? undefined
      } while (cursor)
    }
    if (active.length > 1) throw new ApiError('Encontramos más de una sesión activa. Actualiza la vista antes de continuar.', 0, 'INVALID_RESPONSE')
    return active[0] ?? null
  }

  async detail(id: number, signal?: AbortSignal): Promise<StudySession> {
    return readStudySession(await this.client.request(path(id), { signal }))
  }

  async create(value: StudySessionWrite, signal?: AbortSignal): Promise<StudySession> {
    return readStudySession(await this.client.request('/sessions', { method: 'POST', body: writable(value), signal }))
  }

  async update(id: number, value: StudySessionWrite, signal?: AbortSignal): Promise<StudySession> {
    return readStudySession(await this.client.request(path(id), { method: 'PUT', body: writable(value), signal }))
  }

  async transition(id: number, action: 'start' | 'pause' | 'resume', signal?: AbortSignal): Promise<StudySession> {
    return readStudySession(await this.client.request(`${path(id)}/${action}`, { method: 'POST', signal }))
  }

  async finish(id: number, value: StudySessionFinish, signal?: AbortSignal): Promise<StudySession> {
    return readStudySession(await this.client.request(`${path(id)}/finish`, {
      method: 'POST', body: { status: value.status, context: value.context, other_text: value.context === 'other' ? value.other_text : null }, signal,
    }))
  }

  async remove(id: number, confirmed: true, signal?: AbortSignal): Promise<void> {
    if (confirmed !== true) throw new ApiError('Confirma la eliminación del plan.', 0)
    await this.client.request<void>(path(id), { method: 'DELETE', query: { confirm: 'true' }, signal })
  }
}
