import { chromium, expect as baseExpect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import type { StudyPlan } from '../src/types/studyPlan.ts'

function check(value: unknown, label: string): asserts value {
  if (!value) throw new Error(label)
}
const backend = resolve('../cognova-backend')
const stateDir = process.env.DEMO_STATE_DIR ?? resolve(homedir(), '.local/state/cognova/demo')
const state = JSON.parse(await readFile(resolve(stateDir, 'progress.json'), 'utf8'))
const base: string = state.base
let secret: { email: string; password: string }
try {
  const privateOutput = execFileSync(process.platform === 'win32' ? 'py' : 'python3', [
    ...(process.platform === 'win32' ? ['-3.14'] : []),
    '-m', 'scripts.prepare_demo', 'credentials', '--state-dir', stateDir,
  ], { cwd: backend, encoding: 'utf8' })
  secret = JSON.parse(privateOutput) as { email: string; password: string }
} catch {
  throw new Error('Cannot unlock private demo credentials')
}
const id = (key: string): number => state.steps[key]?.id
const expect = baseExpect.configure({ timeout: 30_000 })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({
  timezoneId: 'America/Bogota', viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
page.setDefaultTimeout(30_000)
let token = '', stage = 'login', forbiddenRequests = 0, pageErrors = 0
const checks: string[] = []
const pending: string[] = []
const errors: { path: string; status: number }[] = []
const output = '.local/permanent-demo'
page.on('pageerror', () => pageErrors++)
page.on('response', response => {
  if (response.url().includes('/api/v1/') && response.status() >= 400
    && !response.url().endsWith('/auth/refresh')) {
    errors.push({ path: new URL(response.url()).pathname, status: response.status() })
  }
})
await context.route('**/api/v1/**', async route => {
  const request = route.request()
  const path = new URL(request.url()).pathname
  if (request.method() !== 'GET' && !['/auth/login', '/auth/logout', '/auth/refresh']
    .some(suffix => path.endsWith(suffix))) {
    forbiddenRequests++
    await route.abort()
    return
  }
  await route.continue()
})

async function login() {
  await page.goto(base + '/login')
  await page.getByLabel('Correo electrónico').fill(secret.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(secret.password)
  const [response] = await Promise.all([
    page.waitForResponse(item => item.url().endsWith('/api/v1/auth/login')),
    page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click(),
  ])
  check(response.status() === 200, 'Dedicated demo login failed')
  const auth = await response.json() as { access_token: string; user: { id: number } }
  check(auth.user.id === state.user_id, 'Wrong account; refusing demonstration')
  token = auth.access_token
  await page.waitForURL('**/dashboard')
}
async function api<T>(path: string): Promise<T> {
  const response = await context.request.get(base + '/api/v1/' + path, {
    headers: { Authorization: 'Bearer ' + token }, maxRedirects: 0,
  })
  check(response.status() === 200, 'Demo read failed: ' + path)
  return response.json() as Promise<T>
}
async function view(path: string, heading: string, filename: string) {
  stage = filename
  await page.goto(base + path)
  await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  check(await page.getByRole('alert').count() === 0, 'Visible module error: ' + filename)
  await page.screenshot({ path: `${output}/${filename}.png`, fullPage: true })
  checks.push(filename)
}
const snapshotHash = (plan: StudyPlan) => createHash('sha256')
  .update(JSON.stringify(plan.ai_proposal_snapshot)).digest('hex')

try {
  await mkdir(output, { recursive: true })
  await login()
  await view('/dashboard', '¿Qué quieres avanzar hoy?', 'dashboard')
  await view('/app/subjects', 'Materias', 'subjects')
  await view('/app/activities', 'Actividades', 'activities')
  await view('/app/sessions', 'Sesiones de estudio', 'sessions')
  await page.goto(`${base}/app/sessions/${id('future-timer')}`)
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible()
  await page.screenshot({ path: `${output}/future-timer.png`, fullPage: true })
  checks.push('future timer ready; not started or mutated')
  stage = 'measured-session'
  await page.goto(`${base}/app/sessions/${id('rehearsal-req')}`)
  await expect(page.getByText('Tiempo efectivo', { exact: true }).first()).toBeVisible()
  await page.screenshot({ path: `${output}/measured-session.png`, fullPage: true })
  checks.push('completed session and real timer intervals visible')
  await view('/app/calendar', 'Calendario', 'calendar-month')
  await page.getByLabel('Ir a fecha', { exact: true }).fill(state.reference)
  await page.getByRole('button', { name: 'Semana', exact: true }).click()
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${output}/calendar-week.png`, fullPage: true })
  checks.push('calendar week')
  await view('/app/study-plans', 'Planes de estudio', 'plans')
  const manual = await api<StudyPlan>(`study-plans/${id('manual-route')}`)
  await view(`/app/study-plans/${manual.id}`, manual.name, 'manual-plan-decisions')
  await expect(page.getByRole('heading', { name: 'Decisiones sobre el plan' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Misiones del plan', exact: true })).toBeVisible()
  for (const key of ['ai-initial', 'ai-contextual']) {
    if (!id(key)) {
      pending.push(key)
      continue
    }
    const plan = await api<StudyPlan>(`study-plans/${id(key)}`)
    check(plan.source === 'ai' && plan.ai_proposal_snapshot, 'Missing genuine AI snapshot')
    await view(`/app/study-plans/${plan.id}`, plan.name, key)
    await expect(page.getByRole('heading', { name: 'Propuesta original de Cognova' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Decisiones sobre el plan' })).toBeVisible()
    check(snapshotHash(await api<StudyPlan>(`study-plans/${plan.id}`)) === snapshotHash(plan),
      'Snapshot changed after reload')
  }
  await view('/app/analytics', 'Análisis', 'analytics')
  await expect(page.getByRole('heading', { name: 'Tiempo de estudio' })).toBeVisible()
  const overview = await api<{
    total_studied_seconds: string
    cancelled_session_seconds: string
  }>('analytics/overview')
  check(overview.total_studied_seconds === '840.735370',
    'Analytics studied-time total differs from controlled rehearsals')
  check(overview.cancelled_session_seconds === '45662.422572',
    'Cancelled timer duration is not reported separately')
  await expect(page.getByText('Tiempo total estudiado', { exact: true })).toBeVisible()
  await expect(page.getByText('Tiempo en sesiones canceladas (excluido)', {
    exact: true,
  })).toBeVisible()
  checks.push('Analytics separates 840.735370 study seconds from 45662.422572 cancelled')
  await page.getByRole('combobox', { name: 'Periodo', exact: true }).selectOption('custom')
  const start = new Date(state.reference + 'T12:00:00Z')
  start.setUTCDate(start.getUTCDate() - 35)
  const end = new Date(state.reference + 'T12:00:00Z')
  end.setUTCDate(end.getUTCDate() + 8)
  await page.getByLabel('Desde (incluido)').fill(start.toISOString().slice(0, 10))
  await page.getByLabel('Hasta (exclusivo)').fill(end.toISOString().slice(0, 10))
  await page.getByRole('combobox', { name: 'Agrupar por' }).selectOption('week')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${output}/analytics-six-week-range.png`, fullPage: true })
  checks.push('six-week analytics range; actual time is not backdated')
  const persistentId = id('ai-initial') ?? id('manual-route')
  const original = await api<StudyPlan>(`study-plans/${persistentId}`)
  const [logout] = await Promise.all([
    page.waitForResponse(item => item.url().endsWith('/api/v1/auth/logout')),
    page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click(),
  ])
  check(logout.status() === 204, 'Logout failed')
  await page.waitForURL('**/login')
  await login()
  const persisted = await api<StudyPlan>(`study-plans/${persistentId}`)
  check(snapshotHash(persisted) === snapshotHash(original), 'Snapshot lost after login')
  check(JSON.stringify(persisted.decisions) === JSON.stringify(original.decisions),
    'Decision history changed after login')
  checks.push('logout/login preserves existing plan and decision history')
  check(forbiddenRequests === 0 && pageErrors === 0 && errors.length === 0,
    'Unexpected request or UI error')
  const report = { at: new Date().toISOString(), base, user_id: state.user_id,
    checks, pending_modules: pending, complete: pending.length === 0,
    page_errors: pageErrors, api_errors: errors, gemini_calls: 0,
    warnings: state.recovery_incidents?.length
      ? ['cancelled_timer_duration_reported_separately_from_study'] : [],
    seed_does_not_backdate_usage: true }
  await writeFile(`${output}/browser-report.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  if (pending.length > 0) process.exitCode = 2
} catch {
  console.error(JSON.stringify({ result: 'failed', stage, checks, errors,
    page_errors: pageErrors, forbidden_requests: forbiddenRequests }))
  process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
}
