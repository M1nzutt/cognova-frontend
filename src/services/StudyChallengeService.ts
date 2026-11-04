import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import { readChallenge, readChallengeList } from '../utils/readStudyPlan'
import { planPath } from './StudyPlanService'
import type { StudyChallenge, StudyChallengeList, StudyChallengeWrite } from '../types/studyPlan'

const base = (planId: number): string => `${planPath(planId)}/challenges`
const path = (planId: number, id: number): string => {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    throw new ApiError('No encontramos esta misión.', 404, 'STUDY_CHALLENGE_NOT_FOUND')
  }
  return `${base(planId)}/${id}`
}
const writable = (value: StudyChallengeWrite): StudyChallengeWrite => ({
  subject_id: value.subject_id,
  activity_id: value.activity_id,
  study_session_id: value.study_session_id,
  title: value.title,
  description: value.description,
  target_type: value.target_type,
  target_value: { ...value.target_value },
  start_at: value.start_at,
  deadline: value.deadline,
  generation_criteria: { ...value.generation_criteria },
  depends_on_activity_ids: [...value.depends_on_activity_ids],
})

export class StudyChallengeService {
  constructor(private readonly client: ApiClient) {}

  async list(planId: number, afterId?: number, signal?: AbortSignal): Promise<StudyChallengeList> {
    return readChallengeList(await this.client.request(base(planId), {
      signal, query: { limit: 20, ...(afterId === undefined ? {} : { after_id: afterId }) },
    }))
  }

  async detail(planId: number, id: number, signal?: AbortSignal): Promise<StudyChallenge> {
    return readChallenge(await this.client.request(path(planId, id), { signal }))
  }

  async create(planId: number, value: StudyChallengeWrite, signal?: AbortSignal): Promise<StudyChallenge> {
    return readChallenge(await this.client.request(base(planId), { method: 'POST', body: writable(value), signal }))
  }

  async update(planId: number, id: number, value: StudyChallengeWrite, signal?: AbortSignal): Promise<StudyChallenge> {
    return readChallenge(await this.client.request(path(planId, id), { method: 'PUT', body: writable(value), signal }))
  }

  async transition(planId: number, id: number, action: 'start' | 'complete' | 'fail' | 'cancel', signal?: AbortSignal): Promise<StudyChallenge> {
    return readChallenge(await this.client.request(`${path(planId, id)}/${action}`, { method: 'POST', signal }))
  }
}
