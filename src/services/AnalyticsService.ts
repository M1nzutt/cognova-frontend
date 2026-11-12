import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import type { AnalyticsOverview, AnalyticsSearchPage, AnalyticsStudyTime, AnalyticsStudyTimeQuery, AnalyticsTimelinePage, AnalyticsTimelineQuery } from '../types/analytics'
const invalid = (): never => { throw new ApiError('No pudimos leer tus análisis. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE') }
const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : invalid()
const count = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const text = (v: unknown): v is string => typeof v === 'string'
const nullableText = (v: unknown): v is string | null => v === null || text(v)
const id = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
const nullableId = (v: unknown): v is number | null => v === null || id(v)
const decimal = (v: unknown): v is string => typeof v === 'string' && /^\d+(?:\.\d{1,6})?$/.test(v)
const date = (v: unknown): v is string => typeof v === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v))
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)
const cursor = (v: unknown): v is string | null => v === null || (text(v) && v.length <= 2048)
export function readAnalyticsOverview(value: unknown): AnalyticsOverview {
 const row=object(value), keys=['finished_sessions','completed_sessions','partial_sessions','postponed_sessions','cancelled_sessions','subjects_with_activity','completed_activities','pending_activities','in_progress_activities','active_plans','completed_plans','completed_challenges','failed_challenges'] as const
 if(!decimal(row.total_studied_seconds)||!decimal(row.total_studied_minutes)||keys.some(key=>!count(row[key]))) return invalid()
 return row as unknown as AnalyticsOverview
}
export function readAnalyticsStudyTime(value: unknown): AnalyticsStudyTime {
 const row=object(value)
 if(!date(row.from)||!date(row.to)||!text(row.timezone)||!(['day','week','month'] as const).some(x=>x===row.granularity)||!decimal(row.total_seconds)||!decimal(row.total_minutes)||!count(row.sessions_count)||!Array.isArray(row.by_subject)||!Array.isArray(row.buckets)) return invalid()
 const subjects=row.by_subject.every(v=>record(v)&&id(v.subject_id)&&text(v.name)&&decimal(v.seconds)&&decimal(v.minutes)&&count(v.sessions_count))
 const buckets=row.buckets.every(v=>record(v)&&date(v.from)&&date(v.to)&&decimal(v.seconds)&&decimal(v.minutes))
 if(!subjects||!buckets) return invalid()
 return row as unknown as AnalyticsStudyTime
}
export function readAnalyticsTimeline(value: unknown): AnalyticsTimelinePage {
 const row=object(value)
 if(!Array.isArray(row.items)||!cursor(row.next_cursor)) return invalid()
 const valid=row.items.every(v=>record(v)&&text(v.event_id)&&date(v.occurred_at)&&['activity','study_session','decision','plan','challenge'].some(x=>x===v.category)&&text(v.event_type)&&text(v.resource_type)&&id(v.resource_id)&&text(v.title)&&nullableId(v.subject_id)&&nullableText(v.subject_name)&&record(v.details))
 if(!valid) return invalid()
 return row as unknown as AnalyticsTimelinePage
}
export function readAnalyticsSearch(value: unknown): AnalyticsSearchPage {
 const row=object(value)
 if(!Array.isArray(row.items)||!cursor(row.next_cursor)) return invalid()
 const valid=row.items.every(v=>record(v)&&['subject','activity','study_plan','study_challenge'].some(x=>x===v.type)&&id(v.id)&&text(v.title)&&nullableId(v.subject_id)&&nullableId(v.plan_id)&&nullableText(v.status))
 if(!valid) return invalid()
 return row as unknown as AnalyticsSearchPage
}
export class AnalyticsService {
 constructor(private readonly client: ApiClient) {}
 async overview(signal?: AbortSignal): Promise<AnalyticsOverview> { return readAnalyticsOverview(await this.client.request('/analytics/overview',{signal})) }
 async studyTime(query: AnalyticsStudyTimeQuery,signal?: AbortSignal): Promise<AnalyticsStudyTime> { return readAnalyticsStudyTime(await this.client.request('/analytics/study-time',{signal,query:{from:query.from,to:query.to,timezone:query.timezone,granularity:query.granularity}})) }
 async timeline(query: AnalyticsTimelineQuery,signal?: AbortSignal): Promise<AnalyticsTimelinePage> {
  return readAnalyticsTimeline(await this.client.request('/analytics/timeline',{signal,query:{from:query.from,to:query.to,...(query.category?{category:query.category}:{}),...(query.cursor?{cursor:query.cursor}:{}),limit:50}}))
 }
 async search(prefix: string,signal?: AbortSignal,cursorValue?: string): Promise<AnalyticsSearchPage> {
  const normalized=prefix.trim()
  if(!normalized||normalized.length>64) throw new ApiError('Escribe entre 1 y 64 caracteres para buscar.',422,'VALIDATION_ERROR')
  return readAnalyticsSearch(await this.client.request('/analytics/search',{signal,query:{prefix:normalized,limit:20,...(cursorValue?{cursor:cursorValue}:{})}}))
 }
}
