/* eslint-disable react-refresh/only-export-components -- test-only API fixture harness */
import { StrictMode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { AppRoutes } from '../routes/AppRoutes'
import { makeToken, user } from './authFixtures'
import { activity } from './activityFixtures'
import { sessionSummary } from './studySessionFixtures'
import type { StudySession, StudySessionSummary } from '../types/studySession'

const subject = { id: 1, name: 'Biología', status: 'active', difficulty: 'medium', color_base: 'green', color_shade: 300, created_at: activity.created_at, updated_at: activity.updated_at }
const otherSubject = { ...subject, id: 2, name: 'Historia' }
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
const initialSession: StudySession = { ...sessionSummary, intervals: [], other_text: null }
const summary = (item: StudySession): StudySessionSummary => {
  const { intervals: _intervals, other_text: _otherText, ...value } = item
  return value
}

export function studySessionSetup(options: {
  path?: string; anonymous?: boolean; incomplete?: boolean; sessions?: StudySession[]; startStatus?: number; deleteStatus?: number; listStatus?: number
} = {}) {
  let records = (options.sessions ?? [initialSession]).map(value => structuredClone(value))
  let nextId = Math.max(0, ...records.map(item => item.id)) + 1
  if (!options.anonymous) document.cookie = 'cognova_csrf=test-csrf; Path=/'
  const fetch = vi.fn(async (input: string | URL, request: RequestInit = {}) => {
    const url = new URL(String(input), 'https://test')
    const method = request.method ?? 'GET'
    if (url.pathname.endsWith('/refresh')) return response({ access_token: makeToken(), token_type: 'bearer' })
    if (url.pathname.endsWith('/me')) return response(options.incomplete ? { ...user, onboarding: { ...user.onboarding, status: 'incomplete', next_step: 'academic_profile' } } : user)
    if (url.pathname.endsWith('/subjects')) return response({ items: [subject, otherSubject], next_after_id: null })
    if (url.pathname.endsWith('/activities')) return response({ items: [{ ...activity, subject_id: 1 }], next_after_id: null })
    if (url.pathname === '/api/v1/sessions' && method === 'GET') {
      if (options.listStatus) return response({ error: { code: 'SERVICE_UNAVAILABLE', message: 'private detail' } }, options.listStatus)
      const state = url.searchParams.get('execution_state'), status = url.searchParams.get('status')
      const items = records.filter(item => (!state || item.execution_state === state) && (!status || item.status === status)
        && (!url.searchParams.has('subject_id') || item.subject_id === Number(url.searchParams.get('subject_id')))
        && (!url.searchParams.has('planned_start_from') || Date.parse(item.planned_start_at) >= Date.parse(url.searchParams.get('planned_start_from')!))
        && (!url.searchParams.has('planned_start_to') || Date.parse(item.planned_start_at) <= Date.parse(url.searchParams.get('planned_start_to')!)))
        .sort((left, right) => Date.parse(left.planned_start_at) - Date.parse(right.planned_start_at) || left.id - right.id)
      return response({ items: items.map(summary), next_cursor: null })
    }
    if (url.pathname === '/api/v1/sessions' && method === 'POST') {
      const body = JSON.parse(String(request.body))
      const item: StudySession = { ...sessionSummary, ...body, id: nextId++, execution_state: 'planned', status: null, start_at: null, end_at: null, actual_duration: '0.000000', context: null, other_text: null, intervals: [] }
      records.push(item)
      return response(item, 201)
    }
    const match = url.pathname.match(/^\/api\/v1\/sessions\/(\d+)(?:\/(start|pause|resume|finish))?$/)
    if (match) {
      const id = Number(match[1]), action = match[2], item = records.find(value => value.id === id)
      if (!item) return response({ error: { code: 'STUDY_SESSION_NOT_FOUND' } }, 404)
      if (method === 'GET') return response(item)
      if (method === 'PUT') {
        if (item.execution_state !== 'planned' || item.intervals.length) return response({ error: { code: 'STUDY_SESSION_CONFLICT' } }, 409)
        Object.assign(item, JSON.parse(String(request.body)))
        return response(item)
      }
      if (method === 'DELETE') {
        if (options.deleteStatus) return response({ error: { code: 'STUDY_SESSION_CONFLICT', message: 'private detail' } }, options.deleteStatus)
        if (item.start_at || item.intervals.length) return response({ error: { code: 'STUDY_SESSION_CONFLICT' } }, 409)
        records = records.filter(value => value.id !== id)
        return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
      }
      if (method === 'POST' && action === 'start') {
        if (options.startStatus) return response({ error: { code: 'STUDY_SESSION_CONFLICT', message: 'private detail' } }, options.startStatus)
        if (item.execution_state !== 'planned') return response({ error: { code: 'STUDY_SESSION_CONFLICT' } }, 409)
        item.execution_state = 'running'; item.start_at = '2030-01-15T15:05:00Z'; item.updated_at = item.start_at
        item.intervals.push({ id: 21, started_at: item.start_at, ended_at: null })
        return response(item)
      }
      if (method === 'POST' && action === 'pause') {
        if (item.execution_state !== 'running') return response({ error: { code: 'STUDY_SESSION_CONFLICT' } }, 409)
        item.execution_state = 'paused'; item.intervals.at(-1)!.ended_at = '2030-01-15T15:15:00Z'; item.actual_duration = '600.000000'; item.updated_at = '2030-01-15T15:15:00Z'
        return response(item)
      }
      if (method === 'POST' && action === 'resume') {
        if (item.execution_state !== 'paused') return response({ error: { code: 'STUDY_SESSION_CONFLICT' } }, 409)
        item.execution_state = 'running'; item.intervals.push({ id: 22, started_at: '2030-01-15T15:20:00Z', ended_at: null }); item.updated_at = '2030-01-15T15:20:00Z'
        return response(item)
      }
      if (method === 'POST' && action === 'finish') {
        if (item.execution_state === 'finished') return response({ error: { code: 'STUDY_SESSION_CONFLICT' } }, 409)
        const body = JSON.parse(String(request.body))
        const open = item.intervals.at(-1)
        if (open && !open.ended_at) open.ended_at = '2030-01-15T15:30:00Z'
        item.execution_state = 'finished'; item.status = body.status; item.context = body.context; item.other_text = body.other_text
        item.end_at = item.start_at ? '2030-01-15T15:30:00Z' : null
        item.actual_duration = item.start_at ? '1500.000000' : '0.000000'
        item.updated_at = '2030-01-15T15:30:00Z'
        return response(item)
      }
    }
    throw new Error(`Unexpected test endpoint ${method} ${url.pathname}`)
  })
  vi.stubGlobal('fetch', fetch)
  const view = render(<StrictMode><MemoryRouter initialEntries={[options.path ?? '/app/sessions']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></StrictMode>)
  return { fetch, view, get sessions() { return records } }
}
