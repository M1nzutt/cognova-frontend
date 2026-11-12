import { ApiClient } from '../api/client'
import { readBehaviorAnalysis } from '../utils/readStudyPlan'
import type { BehaviorAnalysis } from '../types/ai'

export class BehaviorAnalysisService {
  constructor(private readonly client: ApiClient) {}

  async analyze(signal?: AbortSignal): Promise<BehaviorAnalysis> {
    return readBehaviorAnalysis(await this.client.request('/analysis/behavior', { method: 'POST', signal }))
  }
}
