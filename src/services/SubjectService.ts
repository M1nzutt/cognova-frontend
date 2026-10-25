import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import { readSubject, readSubjectCatalog, readSubjectList } from '../utils/readSubject'
import type { SubjectStatus, SubjectWrite } from '../types/subject'
const path = (id: number) => {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new ApiError('No encontramos esa materia.', 404, 'SUBJECT_NOT_FOUND')
  return '/subjects/' + id
}
export class SubjectService {
  constructor(private readonly client: ApiClient) {}
  async catalog(signal?: AbortSignal) { return readSubjectCatalog(await this.client.request('/subjects/catalog', { signal })) }
  async list(status: SubjectStatus | 'all', afterId?: number, signal?: AbortSignal) {
    return readSubjectList(await this.client.request('/subjects', { signal, query: { status, limit: 20, ...(afterId === undefined ? {} : { after_id: afterId }) } }))
  }
  async detail(id: number, signal?: AbortSignal) { return readSubject(await this.client.request(path(id), { signal })) }
  async create(body: SubjectWrite, signal?: AbortSignal) { return readSubject(await this.client.request('/subjects', { method: 'POST', body, signal })) }
  async update(id: number, body: SubjectWrite, signal?: AbortSignal) { return readSubject(await this.client.request(path(id), { method: 'PUT', body, signal })) }
  async archive(id: number, signal?: AbortSignal) { return readSubject(await this.client.request(path(id) + '/archive', { method: 'POST', signal })) }
  async reactivate(id: number, signal?: AbortSignal) { return readSubject(await this.client.request(path(id) + '/reactivate', { method: 'POST', signal })) }
  async remove(id: number, confirmation: true, signal?: AbortSignal) {
    if (confirmation !== true) throw new ApiError('Confirma la eliminación de la materia.', 0)
    await this.client.request<void>(path(id), { method: 'DELETE', query: { confirm: 'true' }, signal })
  }
}
