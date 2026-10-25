import type { Activity, ActivityWrite } from '../types/activity'
export const activityBody: ActivityWrite = { title: 'Leer capítulo', subject_id: 1, deadline: '2030-01-01T15:00:00Z', priority: 'medium', status: 'pending', estimated_duration: 30, notes: null }
export const activity: Activity = { ...activityBody, id: 1, original_deadline: activityBody.deadline, deadline_revision: 0, created_at: '2026-10-24T00:00:00Z', updated_at: '2026-10-24T00:00:00Z' }
