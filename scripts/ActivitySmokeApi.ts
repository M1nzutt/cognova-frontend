import { SubjectSmokeApi } from './SubjectSmokeApi.ts'
import type { ActivityList } from '../src/types/activity.ts'
// The account belongs exclusively to this run. Never delete its immutable history.
export class ActivitySmokeApi extends SubjectSmokeApi {
  override async cleanup() {
    const list = await this.request<ActivityList>('cleanup_activities', 'activities?limit=100', 200)
    for (const item of list.items) {
      if (item.deadline_revision > 0) {
        if (!['cancelled', 'completed'].includes(item.status)) await this.request('retain_cancelled', 'activities/' + item.id + '/status', 200, 'PATCH', { status: 'cancelled', expected_status: item.status })
        await this.request('retain_archived_subject', 'subjects/' + item.subject_id + '/archive', 200, 'POST')
        this.owned.delete(item.subject_id)
      } else await this.request('cleanup_activity_delete', 'activities/' + item.id + '?confirm=true', 204, 'DELETE')
    }
    await super.cleanup()
  }
}
