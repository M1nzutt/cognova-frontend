import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import type { ActivityFilters, ActivityStatus, ActivityWrite } from '../types/activity'
import { readActivity, readActivityList, readDeadlineHistory } from '../utils/readActivity'
const path = (id: number) => {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new ApiError('No encontramos esta actividad.', 404, 'ACTIVITY_NOT_FOUND')
  return '/activities/' + id
}
const writable = (v: ActivityWrite): ActivityWrite => ({ title: v.title, subject_id: v.subject_id, deadline: v.deadline, priority: v.priority, status: v.status, estimated_duration: v.estimated_duration, notes: v.notes })
export class ActivityService {
  constructor(private readonly client: ApiClient) {}
  async list(filters: ActivityFilters = {}, afterId?: number, signal?: AbortSignal) { return readActivityList(await this.client.request('/activities', { signal, query: { ...filters, limit: 20, ...(afterId ? { after_id: afterId } : {}) } })) }
  async detail(id: number, signal?: AbortSignal) { return readActivity(await this.client.request(path(id), { signal })) }
  async create(body: ActivityWrite, signal?: AbortSignal) { return readActivity(await this.client.request('/activities', { method: 'POST', body: writable(body), signal })) }
  async update(id: number, body: ActivityWrite, signal?: AbortSignal) { return readActivity(await this.client.request(path(id), { method: 'PUT', body: writable(body), signal })) }
  async status(id: number, status: ActivityStatus, expected: ActivityStatus, signal?: AbortSignal) { return readActivity(await this.client.request(path(id) + '/status', { method: 'PATCH', body: { status, expected_status: expected }, signal })) }
  async deadline(id: number, deadline: string, revision: number, signal?: AbortSignal) { return readActivity(await this.client.request(path(id) + '/deadline', { method: 'PATCH', body: { deadline, expected_revision: revision }, signal })) }
  async history(id: number, after?: number, signal?: AbortSignal) { return readDeadlineHistory(await this.client.request(path(id) + '/deadline-history', { signal, query: { limit: 20, ...(after ? { after_revision: after } : {}) } })) }
  async remove(id: number, confirmed: true, signal?: AbortSignal) {
    if (confirmed !== true) throw new ApiError('Confirma la eliminación de la actividad.', 0)
    await this.client.request<void>(path(id), { method: 'DELETE', query: { confirm: 'true' }, signal })
  }
}
