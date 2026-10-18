import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import { readCatalog, readHistory, readQuestionnaire } from '../utils/readQuestionnaire'
import type { QuestionnaireRequest, QuestionnaireUpdateRequest } from '../types/questionnaire'

export class QuestionnaireService {
  constructor(private readonly client: ApiClient) {}
  async catalog(signal?: AbortSignal) {
    return readCatalog(await this.client.request('/questionnaire/catalog', { signal }))
  }
  async current(signal?: AbortSignal) {
    try { return readQuestionnaire(await this.client.request('/questionnaire', { signal })) }
    catch (error) {
      if (error instanceof ApiError && error.status === 404 && error.code === 'QUESTIONNAIRE_NOT_FOUND') return null
      throw error
    }
  }
  async create(request: QuestionnaireRequest, signal?: AbortSignal) {
    return readQuestionnaire(await this.client.request('/questionnaire', { method: 'POST', body: request, signal }))
  }
  async update(request: QuestionnaireUpdateRequest, signal?: AbortSignal) {
    return readQuestionnaire(await this.client.request('/questionnaire', { method: 'PUT', body: request, signal }))
  }
  async history(beforeRevision?: number, signal?: AbortSignal) {
    return readHistory(await this.client.request('/questionnaire/history', { signal, query: { limit: 20, ...(beforeRevision === undefined ? {} : { before_revision: beforeRevision }) } }))
  }
}
