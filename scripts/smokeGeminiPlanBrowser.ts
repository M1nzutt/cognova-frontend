import { chromium, expect as baseExpect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import type { QuestionnaireCatalog } from '../src/types/questionnaire.ts'
import type { StudyPlan, StudyChallengeList } from '../src/types/studyPlan.ts'

function check(value: unknown, label: string): asserts value {
  if (!value) throw new Error(label)
}
const base = process.env.SMOKE_LOCAL_URL ?? 'http://127.0.0.1:5180'
const url = new URL(base)
check(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname),
  'Only a local Cognova instance is allowed')
check(process.env.SMOKE_ALLOW_GEMINI_GENERATION === '1', 'Explicit one-generation opt-in required')
const expect = baseExpect.configure({ timeout: 30_000 })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ timezoneId: 'America/Bogota' })
const page = await context.newPage()
page.setDefaultTimeout(30_000)
let access = '', generationRequests = 0, blockedGenerations = 0, pageErrors = 0
let stage = 'synthetic bootstrap'
let syntheticUserId = 0, generatedPlanId = 0
const checks: string[] = []
const statuses: { path: string; status: number }[] = []
page.on('pageerror', () => pageErrors++)
await context.route('**/api/v1/**', async route => {
  const request = route.request()
  const path = new URL(request.url()).pathname
  if (request.method() === 'POST' && path.endsWith('/study-plans/generate')) {
    generationRequests++
    if (generationRequests > 1) {
      blockedGenerations++
      await route.abort()
      return
    }
  }
  if (path.endsWith('/regenerate') || path.endsWith('/analysis/behavior')) {
    blockedGenerations++
    await route.abort()
    return
  }
  await route.continue()
})

async function api<T>(path: string, status = 200, method = 'GET', body?: unknown): Promise<T> {
  const response = await context.request.fetch(`${base}/api/v1/${path}`, {
    method,
    headers: { Origin: base, ...(access ? { Authorization: `Bearer ${access}` } : {}) },
    data: body, timeout: 30_000, maxRedirects: 0,
  })
  statuses.push({ path, status: response.status() })
  check(response.status() === status, `${path}: HTTP ${response.status()}`)
  return response.json() as Promise<T>
}
async function action(label: string, path: string, status = 200) {
  const [response] = await Promise.all([
    page.waitForResponse(item => new URL(item.url()).pathname === `/api/v1/${path}`
      && item.request().method() === 'POST', { timeout: 45_000 }),
    page.getByRole('button', { name: label, exact: true }).click(),
  ])
  check(response.status() === status, `${path}: HTTP ${response.status()}`)
  check(response.headers()['cache-control']?.includes('no-store'), 'Mutation must be no-store')
  statuses.push({ path, status: response.status() })
  return response
}

try {
  const email = `gemini-e2e-${randomBytes(8).toString('hex')}@example.com`
  const password = randomBytes(9).toString('base64')
  const registered = await api<{ access_token: string; user: { id: number } }>(
    'auth/register', 201, 'POST', { name: 'Validación sintética Gemini', email, password })
  access = registered.access_token
  syntheticUserId = registered.user.id
  await api('onboarding/academic-profile', 200, 'PUT', {
    degree_program: 'Programa sintético de validación', semester: 1,
  })
  const catalog = await api<QuestionnaireCatalog>('questionnaire/catalog')
  const answers = Object.fromEntries(catalog.questions.map(question => [
    question.id,
    { choices: [question.options.find(option => option.id !== 'other')!.id], other_text: null },
  ]))
  await api('questionnaire', 201, 'POST', { questionnaire_version: 1, answers })
  const colors = await api<{ color_bases: string[]; color_shades: number[] }>('subjects/catalog')
  const subject = await api<{ id: number }>('subjects', 201, 'POST', {
    name: 'Gemini sintética', difficulty: 'medium',
    color_base: colors.color_bases[0], color_shade: colors.color_shades[0], status: 'active',
  })
  await api('activities', 201, 'POST', {
    subject_id: subject.id, title: 'Práctica sintética pendiente',
    deadline: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    priority: 'high', status: 'pending', estimated_duration: 45,
    notes: 'Datos ficticios para comprobar generación y decisiones.',
  })
  // No existing account is read or reused; credentials remain process-local.
  await context.clearCookies()
  stage = 'UI login'
  await page.goto(`${base}/login`)
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  const login = await action('Iniciar sesión', 'auth/login')
  access = (await login.json() as { access_token: string }).access_token
  await page.goto(`${base}/app/study-plans`)
  await expect(page.getByRole('heading', { name: 'Planes de estudio', exact: true })).toBeVisible()
  checks.push('synthetic account authenticated through UI')

  stage = 'single real generation'
  const generationStarted = Date.now()
  const generated = await action('Proponer un plan con IA', 'study-plans/generate', 201)
  const generationMs = Date.now() - generationStarted
  const result = await generated.json() as { plan: StudyPlan }
  const plan = result.plan
  generatedPlanId = plan.id
  check(plan.source === 'ai' && plan.status === 'draft', 'AI proposal must start as draft')
  check(plan.ai_proposal_snapshot?.model === 'gemini-3.5-flash-lite', 'Selected model must be persisted')
  await expect(page.getByRole('heading', { name: 'Propuesta original de Cognova' })).toBeVisible()
  check(await page.getByRole('heading', { level: 1 }).textContent() === plan.name, 'Generated plan visible')
  await expect(page.getByRole('button', { name: 'Aceptar propuesta', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rechazar propuesta', exact: true })).toBeVisible()
  const missions = await api<StudyChallengeList>(`study-plans/${plan.id}/challenges`)
  check(missions.items.length > 0 && missions.items.every(item => item.source === 'ai'),
    'Real contextual AI challenges must exist')
  await expect(page.getByRole('list', { name: 'Misiones del plan', exact: true })).toBeVisible()
  checks.push('one real plan and contextual challenges generated and visible')

  stage = 'refresh draft and original snapshot'
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Propuesta original de Cognova' })).toBeVisible()
  const refreshedDraft = await api<StudyPlan>(`study-plans/${plan.id}`)
  check(JSON.stringify(refreshedDraft.ai_proposal_snapshot) === JSON.stringify(plan.ai_proposal_snapshot),
    'Original proposal must survive refresh unchanged')
  checks.push('draft and original AI snapshot persisted after refresh')

  stage = 'accept and persist decision'
  const accepted = await action('Aceptar propuesta', `study-plans/${plan.id}/accept`)
  const acceptedPlan = await accepted.json() as StudyPlan
  check(acceptedPlan.status === 'active', 'Acceptance must activate the plan')
  check(acceptedPlan.decisions.some(item => item.action === 'accepted'), 'Acceptance decision persisted')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Decisiones sobre el plan' })).toBeVisible()
  await expect(page.getByText('Aceptada.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Completar plan', exact: true })).toBeVisible()
  const refreshedActive = await api<StudyPlan>(`study-plans/${plan.id}`)
  check(refreshedActive.status === 'active' && refreshedActive.decisions.length === acceptedPlan.decisions.length,
    'Active status and decision count must survive refresh')
  check(JSON.stringify(refreshedActive.ai_proposal_snapshot) === JSON.stringify(plan.ai_proposal_snapshot),
    'Acceptance must not rewrite original proposal')
  checks.push('acceptance, active status, original snapshot and decision history survive refresh')

  stage = 'use generated challenge'
  const mission = missions.items[0]
  await page.goto(`${base}/app/study-plans/${plan.id}/challenges/${mission.id}`)
  await expect(page.getByRole('heading', { name: 'En qué se basa', exact: true })).toBeVisible()
  const started = await action('Iniciar misión', `study-plans/${plan.id}/challenges/${mission.id}/start`)
  check((await started.json() as { status: string }).status === 'in_progress', 'Generated challenge can be started')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Completar misión', exact: true })).toBeVisible()
  checks.push('generated challenge usable and its started state persisted')
  check(generationRequests === 1 && blockedGenerations === 0, 'Exactly one generation, no regeneration')
  check(pageErrors === 0, 'No unhandled UI errors')
  await mkdir('.local', { recursive: true })
  const evidence = {
    at: new Date().toISOString(), base, synthetic_user_id: syntheticUserId, plan_id: generatedPlanId,
    model: 'gemini-3.5-flash-lite', generation_requests: generationRequests, generation_ms: generationMs,
    challenges: missions.items.length, checks, statuses, page_errors: pageErrors,
  }
  await writeFile('.local/gemini-plan-e2e.json', JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify(evidence, null, 2))
} catch {
  console.error(JSON.stringify({ result: 'failed', stage, generation_requests: generationRequests,
    blocked_generations: blockedGenerations, synthetic_user_id: syntheticUserId, plan_id: generatedPlanId, checks, statuses }))
  process.exitCode = 1
} finally {
  // Keep synthetic proposal/decision evidence; never delete academic records.
  await context.close()
  await browser.close()
}
