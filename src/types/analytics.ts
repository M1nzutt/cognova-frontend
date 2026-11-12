export interface AnalyticsOverview {
  total_studied_seconds: string; total_studied_minutes: string
  finished_sessions: number; completed_sessions: number; partial_sessions: number
  postponed_sessions: number; cancelled_sessions: number; subjects_with_activity: number
  completed_activities: number; pending_activities: number; in_progress_activities: number
  active_plans: number; completed_plans: number; completed_challenges: number; failed_challenges: number
}
export type AnalyticsGranularity = 'day' | 'week' | 'month'
export interface AnalyticsStudyTimeQuery { from: string; to: string; timezone: string; granularity: AnalyticsGranularity }
export interface AnalyticsStudyTimeSubject { subject_id: number; name: string; seconds: string; minutes: string; sessions_count: number }
export interface AnalyticsStudyTimeBucket { from: string; to: string; seconds: string; minutes: string }
export interface AnalyticsStudyTime extends AnalyticsStudyTimeQuery {
  total_seconds: string; total_minutes: string; sessions_count: number
  by_subject: AnalyticsStudyTimeSubject[]; buckets: AnalyticsStudyTimeBucket[]
}
export const analyticsCategories = ['activity', 'study_session', 'decision', 'plan', 'challenge'] as const
export type AnalyticsCategory = typeof analyticsCategories[number]
export interface AnalyticsTimelineQuery { from: string; to: string; category?: AnalyticsCategory; cursor?: string }
export interface AnalyticsTimelineItem {
  event_id: string; occurred_at: string; category: AnalyticsCategory; event_type: string
  resource_type: string; resource_id: number; title: string
  subject_id: number | null; subject_name: string | null; details: Record<string, unknown>
}
export interface AnalyticsTimelinePage { items: AnalyticsTimelineItem[]; next_cursor: string | null }
export const analyticsSearchTypes = ['subject', 'activity', 'study_plan', 'study_challenge'] as const
export type AnalyticsSearchType = typeof analyticsSearchTypes[number]
export interface AnalyticsSearchItem {
  type: AnalyticsSearchType; id: number; title: string
  subject_id: number | null; plan_id: number | null; status: string | null
}
export interface AnalyticsSearchPage { items: AnalyticsSearchItem[]; next_cursor: string | null }
