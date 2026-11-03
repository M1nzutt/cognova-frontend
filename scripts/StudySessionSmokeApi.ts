import type { BrowserContext } from '@playwright/test'
import { SubjectSmokeApi, check, production } from './SubjectSmokeApi.ts'
import type { Activity } from '../src/types/activity.ts'
import type { StudySession, StudySessionList, StudySessionWrite } from '../src/types/studySession.ts'
import type { Subject } from '../src/types/subject.ts'

/** Production smoke helper. All writes belong to this run's synthetic account. */
export class StudySessionSmokeApi extends SubjectSmokeApi {
  readonly subjects = new Set<number>()
  readonly activities = new Set<number>()
  readonly sessions = new Set<number>()
  readonly deletedSessions = new Set<number>()
  readonly retainedSessions: number[] = []

  constructor(context: BrowserContext) { super(context) }

  override async create(name: string, status: 'active' | 'archived' = 'active') {
    const subject = await super.create(name, status)
    this.subjects.add(subject.id)
    return subject
  }

  async createActivity(subjectId: number) {
    const activity = await this.request<Activity>('synthetic_activity', 'activities', 201, 'POST', {
      title: 'Smoke de sesi\u00f3n', subject_id: subjectId,
      deadline: new Date(Date.now() + 86_400_000).toISOString(), priority: 'medium',
      status: 'pending', estimated_duration: 30, notes: 'Synthetic session validation',
    })
    this.activities.add(activity.id)
    return activity
  }

  async createSession(value: StudySessionWrite) {
    const item = await this.request<StudySession>('synthetic_session', 'sessions', 201, 'POST', value)
    this.sessions.add(item.id)
    return item
  }

  async cleanupSessionsAndLogout() {
    // Close a synthetic timer if a smoke failure interrupted it. Preserve its history.
    for (const id of this.sessions) {
      if (this.deletedSessions.has(id)) continue
      const item = await this.request<StudySession>('cleanup_session_detail', 'sessions/' + id, 200)
      if (item.execution_state === 'running') await this.request<StudySession>('cleanup_pause', `sessions/${id}/pause`, 200, 'POST')
      const current = await this.request<StudySession>('cleanup_session_state', 'sessions/' + id, 200)
      if (current.execution_state === 'paused') {
        await this.request<StudySession>('cleanup_finish_synthetic', `sessions/${id}/finish`, 200, 'POST', {
          status: 'partial', context: 'interrupted', other_text: null,
        })
      } else if (current.execution_state === 'planned' && current.start_at === null && current.intervals.length === 0) {
        await this.request('cleanup_delete_unstarted_plan', `sessions/${id}?confirm=true`, 204, 'DELETE')
        this.deletedSessions.add(id)
      }
    }

    const sessionList = await this.request<StudySessionList>('cleanup_session_list', 'sessions?limit=100', 200)
    const retained = sessionList.items.filter(item => this.sessions.has(item.id))
    this.retainedSessions.push(...retained.map(item => item.id))
    const retainedSubjects = new Set(retained.map(item => item.subject_id))
    const retainedActivities = new Set(retained.flatMap(item => item.activity_id ? [item.activity_id] : []))

    for (const id of this.activities) {
      if (!retainedActivities.has(id)) await this.request('cleanup_synthetic_activity', `activities/${id}?confirm=true`, 204, 'DELETE')
      else retainedSubjects.add((await this.request<Activity>('cleanup_retained_activity', `activities/${id}`, 200)).subject_id)
    }

    const subjectList = await this.request<{ items: Subject[] }>('cleanup_subject_list', 'subjects?status=all&limit=100', 200)
    for (const id of this.subjects) {
      const subject = subjectList.items.find(item => item.id === id)
      if (!subject) continue
      if (retainedSubjects.has(id)) {
        if (subject.status === 'active') await this.request('cleanup_archive_retained_subject', `subjects/${id}/archive`, 200, 'POST')
      } else await this.request('cleanup_delete_synthetic_subject', `subjects/${id}?confirm=true`, 204, 'DELETE')
    }

    await this.request('logout_csrf_rejected', 'auth/logout', 403, 'POST')
    await this.request('cleanup_logout', 'auth/logout', 204, 'POST', undefined, true)
    await this.request('revoked_sessions_access', 'sessions', 401)
  }
}

export function assertSameDuration(actual: string, intervals: { started_at: string; ended_at: string | null }[]) {
  check(intervals.length > 0 && intervals.every(item => item.ended_at !== null), 'finished session has closed intervals')
  const measured = intervals.reduce((seconds, item) => seconds + (Date.parse(item.ended_at!) - Date.parse(item.started_at)) / 1000, 0)
  check(Math.abs(Number(actual) - measured) < 0.25, 'effective time equals sum of execution intervals')
}

export { production }
