import { chromium, expect as baseExpect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { StudySessionSmokeApi, production } from './StudySessionSmokeApi.ts'
import { check } from './SubjectSmokeApi.ts'
import type { StudyPlan, StudyPlanList } from '../src/types/studyPlan.ts'

check(process.env.SMOKE_ALLOW_PRODUCTION_WRITE === '1', 'Explicit production write opt-in required')
const expect = baseExpect.configure({ timeout: 30_000 })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/Bogota' })
const page = await context.newPage()
const api = new StudySessionSmokeApi(context)
page.setDefaultTimeout(30_000)
const checks: string[] = []
const retainedPlans: number[] = [], deletedPlans: number[] = []
const retainedSubjects: number[] = [], retainedActivities: number[] = [], retainedSessions: number[] = []
const responses: { path: string; method: string; status: number; noStore: boolean }[] = []
const responseTasks: Promise<void>[] = []
let stage = 'anonymous route', pageErrors = 0, loggedOut = false
page.on('pageerror', () => { pageErrors++ })
page.on('response', response => {
  if (!response.url().includes('/api/v1/')) return
  responseTasks.push((async () => {
    const headers = await response.allHeaders()
    responses.push({ path: new URL(response.url()).pathname, method: response.request().method(), status: response.status(), noStore: !!headers['cache-control']?.includes('no-store') })
  })())
})
const planRoute = (id: number) => `${production}/app/study-plans/${id}`
async function action(name: string, expectedPath: string, method = 'POST') {
  const [response] = await Promise.all([
    page.waitForResponse(item => new URL(item.url()).pathname.endsWith(expectedPath) && item.request().method() === method),
    page.getByRole('button', { name, exact: true }).click(),
  ])
  check(response.status() >= 200 && response.status() < 300, `${name}: HTTP ${response.status()}`)
  return response
}
async function createPlan(name: string, withRelations: boolean, subjectId: number, activityId: number) {
  await page.goto(`${production}/app/study-plans/new`)
  await page.getByLabel('Nombre del plan').fill(name)
  await page.getByLabel('¿Qué quieres lograr?').fill('Validar el recorrido de estudio en producción')
  if (withRelations) {
    await page.getByRole('checkbox', { name: 'Plan smoke Biología' }).check()
    await page.getByRole('checkbox', { name: 'Smoke de sesión' }).check()
    await page.locator('fieldset').filter({ hasText: 'Sesiones' }).getByRole('checkbox').last().check()
  }
  const response = await action('Crear plan', '/study-plans')
  const plan = await response.json() as StudyPlan
  check(plan.name === name && plan.subjects.length === (withRelations ? 1 : 0), 'plan form persisted relations')
  if (withRelations) check(plan.subjects[0].id === subjectId && plan.activities[0].id === activityId && plan.study_sessions.length === 1, 'subject/activity/session links persisted')
  await expect(page.getByRole('heading', { name })).toBeVisible()
  return plan
}
async function createMission(planId: number, title: string, subjectId: number) {
  await page.goto(planRoute(planId))
  await page.getByRole('button', { name: 'Añadir misión' }).click()
  await page.getByLabel('Nombre de la misión').fill(title)
  await page.getByLabel('¿Cómo vas a cumplirla?').fill('Repasar el material de la materia')
  await page.getByLabel('Materia relacionada').selectOption(String(subjectId))
  const response = await action('Añadir misión', `/study-plans/${planId}/challenges`)
  const challenge = await response.json() as { id: number; title: string; status: string }
  check(challenge.title === title && challenge.status === 'pending', 'mission created inside plan')
  await expect(page.getByRole('list', { name: 'Misiones del plan' }).getByRole('link', { name: title })).toBeVisible()
  return challenge.id
}
async function missionTransition(planId: number, id: number, label: string, actionName: string) {
  await page.goto(`${planRoute(planId)}/challenges/${id}`)
  await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
  const response = await action(label, `/study-plans/${planId}/challenges/${id}/${actionName}`)
  return response.json() as Promise<{ status: string }>
}
async function cleanupAcademicResources() {
  const list = await api.request<StudyPlanList>('cleanup_plan_list', 'study-plans?status=all&limit=100', 200)
  const linkedSubjects = new Set<number>(), linkedActivities = new Set<number>(), linkedSessions = new Set<number>()
  retainedPlans.length = 0
  for (const summary of list.items) {
    const plan = await api.request<StudyPlan>('cleanup_plan_detail', `study-plans/${summary.id}`, 200)
    if (plan.source === 'manual' && plan.status === 'draft' && !plan.subjects.length && !plan.activities.length && !plan.study_sessions.length && !plan.decisions.length && !plan.challenge_count) {
      await api.request('cleanup_empty_draft', `study-plans/${plan.id}?confirm=true`, 204, 'DELETE')
      deletedPlans.push(plan.id)
      continue
    }
    retainedPlans.push(plan.id)
    plan.subjects.forEach(item => linkedSubjects.add(item.id))
    plan.activities.forEach(item => linkedActivities.add(item.id))
    plan.study_sessions.forEach(item => linkedSessions.add(item.id))
  }
  for (const id of api.sessions) {
    if (linkedSessions.has(id)) retainedSessions.push(id)
    else await api.request('cleanup_unlinked_session', `sessions/${id}?confirm=true`, 204, 'DELETE')
  }
  for (const id of api.activities) {
    if (linkedActivities.has(id)) retainedActivities.push(id)
    else await api.request('cleanup_unlinked_activity', `activities/${id}?confirm=true`, 204, 'DELETE')
  }
  for (const id of api.subjects) {
    if (linkedSubjects.has(id)) retainedSubjects.push(id)
    else await api.request('cleanup_unlinked_subject', `subjects/${id}?confirm=true`, 204, 'DELETE')
  }
}

try {
  await mkdir('.local', { recursive: true })
  await page.goto(`${production}/app/study-plans`)
  await expect(page).toHaveURL(/\/login$/)
  checks.push('anonymous direct route redirects to login')

  stage = 'synthetic account and academic resources'
  await api.bootstrap()
  const subject = await api.create('Plan smoke Biología')
  const activity = await api.createActivity(subject.id)
  await api.createSession({ subject_id: subject.id, activity_id: activity.id, planned_start_at: new Date(Date.now() + 72 * 3_600_000).toISOString(), planned_duration: 40 })
  await page.goto(`${production}/app/study-plans`)
  await expect(page.getByRole('heading', { name: 'Planes de estudio' })).toBeVisible()
  await expect(page.getByText('Tu primer plan empieza aquí')).toBeVisible()
  checks.push('authenticated empty plan list and existing academic resources')

  stage = 'create, edit, relations and decisions'
  const main = await createPlan('Plan de validación', true, subject.id, activity.id)
  retainedPlans.push(main.id)
  await expect(page.getByRole('heading', { name: 'Tu ritmo semanal' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'En qué enfocarte' })).toBeVisible()
  await page.getByRole('button', { name: 'Editar borrador' }).click()
  await page.getByLabel('Nombre del plan').fill('Plan de validación editado')
  await action('Guardar cambios', `/study-plans/${main.id}`, 'PUT')
  await expect(page.getByRole('heading', { name: 'Plan de validación editado' })).toBeVisible()
  await expect(page.getByText(/Editaste nombre/)).toBeVisible()
  checks.push('create, edit, related subject/activity/session, backend projections and decision evidence')

  stage = 'draft mission, transitions and refresh'
  const doneId = await createMission(main.id, 'Misión completa', subject.id)
  await page.goto(`${planRoute(main.id)}/challenges/${doneId}`)
  await page.getByRole('button', { name: 'Editar misión' }).click()
  await page.getByLabel('Nombre de la misión').fill('Misión completa editada')
  await action('Guardar misión', `/study-plans/${main.id}/challenges/${doneId}`, 'PUT')
  const started = await missionTransition(main.id, doneId, 'Iniciar misión', 'start')
  check(started.status === 'in_progress', 'mission started')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Completar misión' })).toBeVisible()
  const completed = await action('Completar misión', `/study-plans/${main.id}/challenges/${doneId}/complete`)
  check((await completed.json() as { status: string }).status === 'completed', 'mission completed')
  checks.push('draft mission create/edit/start/complete and direct route refresh')

  stage = 'other mission outcomes and plan activation'
  await page.goto(planRoute(main.id))
  await action('Activar plan', `/study-plans/${main.id}/activate`)
  const failedId = await createMission(main.id, 'Misión fallida', subject.id)
  await missionTransition(main.id, failedId, 'Iniciar misión', 'start')
  const failed = await missionTransition(main.id, failedId, 'Marcar como fallida', 'fail')
  check(failed.status === 'failed', 'mission failed')
  const cancelledId = await createMission(main.id, 'Misión cancelada', subject.id)
  const cancelled = await missionTransition(main.id, cancelledId, 'Cancelar misión', 'cancel')
  check(cancelled.status === 'cancelled', 'mission cancelled')
  await page.goto(planRoute(main.id))
  await action('Completar plan', `/study-plans/${main.id}/complete`)
  await expect(page.getByText('Completado').first()).toBeVisible()
  checks.push('activation, complete plan, mission fail/cancel')

  stage = 'abandon and safe delete'
  const abandoned = await createPlan('Plan para abandonar', false, subject.id, activity.id)
  retainedPlans.push(abandoned.id)
  await action('Abandonar plan', `/study-plans/${abandoned.id}/abandon`)
  const deletable = await createPlan('Borrador temporal', false, subject.id, activity.id)
  await page.getByRole('button', { name: 'Eliminar plan' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await action('Sí, eliminar', `/study-plans/${deletable.id}`, 'DELETE')
  deletedPlans.push(deletable.id)
  await api.request('deleted_plan_404', `study-plans/${deletable.id}`, 404)
  checks.push('abandon and confirmed safe draft delete')

  stage = 'responsive, keyboard, auth and no-store'
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 })
    await page.goto(planRoute(main.id))
    await expect(page.getByRole('heading', { name: 'Plan de validación editado' })).toBeVisible()
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal overflow at ${width}`)
    await page.screenshot({ path: `.local/study-plans-${width}.png`, fullPage: true })
  }
  const missionLink = page.getByRole('link', { name: 'Misión completa editada' })
  await missionLink.focus(); await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Misión completa editada' })).toBeVisible()
  checks.push('desktop/mobile layout, keyboard mission navigation and no horizontal overflow')
  await Promise.all(responseTasks)
  check(responses.length > 10 && responses.every(item => item.noStore), 'all observed API responses have no-store')
  check(pageErrors === 0, 'no unhandled JavaScript errors')
  await api.request('manual_regenerate_conflict', `study-plans/${main.id}/regenerate`, 409, 'POST')
  checks.push('manual regenerate rejected; AI 503 cannot be created through public API')

  stage = 'synthetic cleanup and auth revocation'
  await cleanupAcademicResources()
  await api.request('logout', 'auth/logout', 204, 'POST', undefined, true)
  loggedOut = true
  await api.request('revoked_auth', 'study-plans', 401)
  checks.push('synthetic auth revoked and protected API returns 401')

  const evidence = { at: new Date().toISOString(), url: production, checks, user_id: api.userId,
    retained_plans: retainedPlans, deleted_plans: deletedPlans, retained_subjects: retainedSubjects, retained_activities: retainedActivities, retained_sessions: retainedSessions,
    response_count: responses.length, page_errors: pageErrors, api: api.evidence }
  await writeFile('.local/study-plans-smoke.json', JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify(evidence, null, 2))
} catch (error) {
  console.error(`Study plans smoke failed at ${stage}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  if (api.userId && !loggedOut) {
    try { await cleanupAcademicResources() }
    catch { console.error('Synthetic academic resource cleanup needs review') }
    try { await api.request('cleanup_logout', 'auth/logout', 204, 'POST', undefined, true); await api.request('cleanup_revoked_auth', 'study-plans', 401) }
    catch { console.error('Synthetic auth cleanup needs review') }
  }
  await context.close(); await browser.close()
}
