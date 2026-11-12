import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import { readAiPlanGeneration, readPlan, readPlanList } from '../utils/readStudyPlan'
import type { AiPlanGenerationResponse } from '../types/ai'
import type { PlanStatus, StudyPlan, StudyPlanList, StudyPlanWrite } from '../types/studyPlan'

export function planPath(id: number): string {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    throw new ApiError('No encontramos este plan.', 404, 'STUDY_PLAN_NOT_FOUND')
  }
  return `/study-plans/${id}`
}

const writable = (value: StudyPlanWrite): StudyPlanWrite => ({
  name: value.name,
  objective: value.objective,
  start_at: value.start_at,
  end_at: value.end_at,
  subject_ids: [...value.subject_ids],
  activity_ids: [...value.activity_ids],
  study_session_ids: [...value.study_session_ids],
})

export class StudyPlanService {
  constructor(private readonly client: ApiClient) {}

  async generate(signal?: AbortSignal): Promise<AiPlanGenerationResponse> {
    return readAiPlanGeneration(await this.client.request('/study-plans/generate', { method: 'POST', signal }))
  }

  async list(status: PlanStatus | 'all' = 'all', afterId?: number, signal?: AbortSignal): Promise<StudyPlanList> {
    return readPlanList(await this.client.request('/study-plans', {
      signal, query: { status, limit: 20, ...(afterId === undefined ? {} : { after_id: afterId }) },
    }))
  }

  async detail(id: number, signal?: AbortSignal): Promise<StudyPlan> {
    return readPlan(await this.client.request(planPath(id), { signal }))
  }

  async create(value: StudyPlanWrite, signal?: AbortSignal): Promise<StudyPlan> {
    return readPlan(await this.client.request('/study-plans', { method: 'POST', body: writable(value), signal }))
  }

  async update(id: number, value: StudyPlanWrite, signal?: AbortSignal): Promise<StudyPlan> {
    return readPlan(await this.client.request(planPath(id), { method: 'PUT', body: writable(value), signal }))
  }

  async transition(id: number, action: 'activate' | 'complete' | 'abandon' | 'accept' | 'reject' | 'undo' | 'regenerate', signal?: AbortSignal): Promise<StudyPlan> {
    return readPlan(await this.client.request(`${planPath(id)}/${action}`, { method: 'POST', signal }))
  }

  async remove(id: number, confirmed: true, signal?: AbortSignal): Promise<void> {
    if (confirmed !== true) throw new ApiError('Confirma la eliminación del plan.', 0)
    await this.client.request<void>(planPath(id), { method: 'DELETE', query: { confirm: 'true' }, signal })
  }
}
