import { StrictMode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { AppRoutes } from '../routes/AppRoutes'
import { makeToken, user } from './authFixtures'
import { activity } from './activityFixtures'
import { sessionSummary } from './studySessionFixtures'
import type { StudyPlan, StudyChallenge } from '../types/studyPlan'

const now = '2030-01-01T10:00:00Z'
const subject = { id: 1, name: 'Biología', status: 'active', difficulty: 'medium', color_base: 'green', color_shade: 300, created_at: now, updated_at: now }
export const planFixture: StudyPlan = {
  id: 4, name: 'Preparar examen', objective: 'Aprender biología', start_at: '2030-01-01T10:00:00Z', end_at: '2030-02-01T10:00:00Z',
  status: 'draft', source: 'manual', ai_proposal_snapshot: null, created_at: now, updated_at: now,
  subjects: [{ id: 1, name: 'Biología' }], activities: [{ id: activity.id, subject_id: 1, title: activity.title, deadline: activity.deadline, priority: activity.priority, status: activity.status, estimated_duration: activity.estimated_duration }],
  study_sessions: [{ id: sessionSummary.id, subject_id: 1, activity_id: activity.id, planned_start_at: sessionSummary.planned_start_at, planned_duration: sessionSummary.planned_duration, execution_state: sessionSummary.execution_state, status: sessionSummary.status, start_at: sessionSummary.start_at, end_at: sessionSummary.end_at, actual_duration: sessionSummary.actual_duration, context: sessionSummary.context }],
  decisions: [], challenge_count: 0, hierarchy: { key: 'plan:4', kind: 'plan', label: 'Preparar examen', children: [] },
  priority_order: [activity.id], activity_dependency_order: [activity.id], weekly_rhythm: Array.from({ length: 7 }, (_, weekday) => ({ weekday, name: 'Día', planned_minutes: 30 })), candidate_slots: [], schedule_conflict: false,
}
export const aiProposalFixture: NonNullable<StudyPlan['ai_proposal_snapshot']> = {
  schema_version: 1, model: 'gemini-test-model', generated_at: now,
  explanation: 'La propuesta organiza el repaso antes de la evaluación.',
  reasoning_summary: 'Considera las fechas de tus recursos y el tiempo disponible.',
  plan: { name: 'Preparar examen', objective: 'Aprender biología', start_date: '2030-01-01', end_date: '2030-02-01', subject_ids: [1], activity_ids: [activity.id], session_ids: [sessionSummary.id] },
  proposed_challenges: [{ title: 'Repasar células', objective: 'Recordar conceptos clave', explanation: 'Un repaso breve ayuda a distribuir el estudio.', evidence: ['Hay una actividad de biología vinculada.'], target_type: 'study_minutes', target_id: null, subject_id: 1, activity_id: activity.id, session_id: null, target_value: { minutes: 30 }, measurable_condition: 'Completar 30 minutos de estudio', start_date: '2030-01-05', end_date: '2030-01-10' }],
}
export const aiPlanFixture: StudyPlan = { ...planFixture, source: 'ai', ai_proposal_snapshot: aiProposalFixture }
export const behaviorFixture = {
  finished_session_count: 5, pattern_eligible: true,
  observations: [{ observation: 'En algunas sesiones recientes empezaste con más tiempo del que planeabas.', evidence: ['Dos sesiones comenzaron antes de la hora prevista.'], question: '¿Qué te ayudó a empezar en esos momentos?', confidence_basis: 'La observación se apoya en dos sesiones de las cinco finalizadas.', related_subject_ids: [1], related_activity_ids: [activity.id], related_session_ids: [sessionSummary.id] }],
}
export const challengeFixture: StudyChallenge = {
  id: 8, plan_id: 4, subject_id: 1, activity_id: null, study_session_id: null,
  title: 'Repasar células', description: 'Leer el capítulo y tomar notas', target_type: 'study_minutes', target_value: { minutes: 30 },
  start_at: null, deadline: '2030-01-25T15:00:00Z', generation_criteria: { rationale: 'Misión manual' },
  status: 'pending', source: 'manual', created_at: now, updated_at: now,
}
const response = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders } })

export function studyPlanSetup(options: { path?: string; plans?: StudyPlan[]; challenges?: StudyChallenge[]; anonymous?: boolean; incomplete?: boolean; generateStatus?: number; generateGate?: Promise<void>; behaviorStatus?: number; behaviorCode?: string; behaviorSessionCount?: number; regenerateStatus?: number; transitionStatus?: number; challengeStatus?: number } = {}) {
  let plans = structuredClone(options.plans ?? [planFixture])
  const challenges = structuredClone(options.challenges ?? [])
  if (!options.anonymous) document.cookie = 'cognova_csrf=test-csrf; Path=/'
  const fetch = vi.fn(async (input: string | URL, request: RequestInit = {}) => {
    const url = new URL(String(input), 'https://test'), method = request.method ?? 'GET', path = url.pathname
    if (path.endsWith('/refresh')) return options.anonymous ? response({ error: { code: 'INVALID_REFRESH_TOKEN' } }, 401) : response({ access_token: makeToken(), token_type: 'bearer' })
    if (path.endsWith('/me')) return response(options.incomplete ? { ...user, onboarding: { ...user.onboarding, status: 'incomplete', next_step: 'academic_profile' } } : user)
    if (path === '/api/v1/subjects') return response({ items: [subject], next_after_id: null })
    if (path === '/api/v1/activities') return response({ items: [{ ...activity, subject_id: 1 }], next_after_id: null })
    if (path === '/api/v1/sessions') return response({ items: [sessionSummary], next_cursor: null })
    if (path === '/api/v1/analysis/behavior' && method === 'POST') {
      if (options.behaviorStatus) return response({ error: { code: options.behaviorCode ?? 'GEMINI_RATE_LIMIT', message: 'private detail' } }, options.behaviorStatus, options.behaviorCode === 'GEMINI_RATE_LIMIT' || !options.behaviorCode ? { 'Retry-After': '30' } : {})
      const count = options.behaviorSessionCount ?? behaviorFixture.finished_session_count
      const observations = count >= 5 ? behaviorFixture.observations : count === 0 ? [] : [{
        observation: `Tienes ${count} sesiones finalizadas registradas.`, evidence: [`Cognova encontró ${count} sesiones finalizadas.`],
        question: '¿Qué notas al revisar estas sesiones?', confidence_basis: `Este dato describe ${count} sesiones; todavía no identifica un patrón.`,
        related_subject_ids: [], related_activity_ids: [], related_session_ids: [],
      }]
      return response({ ...behaviorFixture, finished_session_count: count, pattern_eligible: count >= 5, observations })
    }
    if (path === '/api/v1/study-plans/generate' && method === 'POST') {
      await options.generateGate
      if (options.generateStatus) return response({ error: { code: options.generateStatus === 429 ? 'GEMINI_RATE_LIMIT' : 'STUDY_PLAN_GENERATION_UNAVAILABLE', message: 'private detail' } }, options.generateStatus)
      const generated = { ...structuredClone(aiPlanFixture), id: 10 }
      plans.push(generated)
      return response({ plan: generated, explanation: aiProposalFixture.explanation, reasoning_summary: aiProposalFixture.reasoning_summary }, 201)
    }
    if (path === '/api/v1/study-plans') {
      if (method === 'GET') {
        const status = url.searchParams.get('status')
        return response({ items: plans.filter(item => status === 'all' || item.status === status).map(item => ({ id: item.id, name: item.name, objective: item.objective, start_at: item.start_at, end_at: item.end_at, status: item.status, source: item.source, created_at: item.created_at, updated_at: item.updated_at })), next_after_id: null })
      }
      if (method === 'POST') {
        const body = JSON.parse(String(request.body))
        const plan: StudyPlan = { ...structuredClone(planFixture), ...body, id: 10, name: body.name, objective: body.objective, subjects: [], activities: [], study_sessions: [], decisions: [], status: 'draft', source: 'manual', challenge_count: 0, priority_order: [], activity_dependency_order: [], hierarchy: { key: 'plan:10', kind: 'plan', label: body.name, children: [] } }
        plans.push(plan); return response(plan, 201)
      }
    }
    const planMatch = path.match(/^\/api\/v1\/study-plans\/(\d+)(?:\/(activate|complete|abandon|accept|reject|regenerate))?$/)
    if (planMatch) {
      const id = Number(planMatch[1]), action = planMatch[2], plan = plans.find(item => item.id === id)
      if (!plan) return response({ error: { code: 'STUDY_PLAN_NOT_FOUND', message: 'private detail' } }, 404)
      if (method === 'GET') return response(plan)
      if (method === 'PUT') { Object.assign(plan, JSON.parse(String(request.body))); plan.updated_at = '2030-01-02T10:00:00Z'; return response(plan) }
      if (method === 'DELETE') { plans = plans.filter(item => item.id !== id); return new Response(null, { status: 204 }) }
      if (method === 'POST' && action) {
        if (action === 'regenerate' && (options.regenerateStatus ?? 503) !== 200) return response({ error: { code: 'STUDY_PLAN_GENERATION_UNAVAILABLE', message: 'private detail' } }, options.regenerateStatus ?? 503)
        if (options.transitionStatus) return response({ error: { code: 'STUDY_PLAN_CONFLICT', message: 'private detail' } }, options.transitionStatus)
        if (action === 'regenerate') {
          const previous = structuredClone(plan.ai_proposal_snapshot)
          const next = { ...structuredClone(aiProposalFixture), generated_at: '2030-01-02T10:00:00Z', plan: { ...aiProposalFixture.plan, name: 'Nueva propuesta' } }
          plan.ai_proposal_snapshot = next
          plan.name = next.plan.name
          plan.decisions.push({ id: 2, action: 'regenerated', field_path: null, proposed_value: previous, chosen_value: next, created_at: now })
          return response(plan)
        }
        plan.status = action === 'activate' || action === 'accept' ? 'active' : action === 'complete' ? 'completed' : 'abandoned'
        if (action === 'accept' || action === 'reject') plan.decisions.push({ id: 1, action: action === 'accept' ? 'accepted' : 'rejected', field_path: null, proposed_value: { name: plan.name }, chosen_value: action === 'accept' ? { name: plan.name } : null, created_at: now })
        return response(plan)
      }
    }
    const challengeMatch = path.match(/^\/api\/v1\/study-plans\/(\d+)\/challenges(?:\/(\d+))?(?:\/(start|complete|fail|cancel))?$/)
    if (challengeMatch) {
      const planId = Number(challengeMatch[1]), id = challengeMatch[2] ? Number(challengeMatch[2]) : null, action = challengeMatch[3]
      if (id === null && method === 'GET') return response({ items: challenges.filter(item => item.plan_id === planId), next_after_id: null })
      if (id === null && method === 'POST') { const body = JSON.parse(String(request.body)); const challenge: StudyChallenge = { ...challengeFixture, ...body, id: 9, plan_id: planId, status: 'pending', source: 'manual', created_at: now, updated_at: now }; challenges.push(challenge); const plan = plans.find(item => item.id === planId); if (plan) plan.challenge_count++; return response(challenge, 201) }
      const challenge = challenges.find(item => item.id === id && item.plan_id === planId)
      if (!challenge) return response({ error: { code: 'STUDY_CHALLENGE_NOT_FOUND', message: 'private detail' } }, 404)
      if (method === 'GET') return response(challenge)
      if (method === 'PUT') { Object.assign(challenge, JSON.parse(String(request.body))); return response(challenge) }
      if (method === 'POST' && action) {
        if (options.challengeStatus) return response({ error: { code: 'STUDY_CHALLENGE_CONFLICT', message: 'private detail' } }, options.challengeStatus)
        challenge.status = action === 'start' ? 'in_progress' : action === 'complete' ? 'completed' : action === 'fail' ? 'failed' : 'cancelled'; return response(challenge)
      }
    }
    throw new Error(`Unexpected endpoint ${method} ${path}`)
  })
  vi.stubGlobal('fetch', fetch)
  const view = render(<StrictMode><MemoryRouter initialEntries={[options.path ?? '/app/study-plans']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></StrictMode>)
  return { fetch, view, get plans() { return plans }, get challenges() { return challenges } }
}
