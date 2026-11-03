import { chromium, expect as baseExpect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { StudySessionSmokeApi, assertSameDuration, production } from './StudySessionSmokeApi.ts'
import { check } from './SubjectSmokeApi.ts'
import type { StudySession, StudySessionWrite } from '../src/types/studySession.ts'

check(process.env.SMOKE_ALLOW_PRODUCTION_WRITE === '1', 'Explicit production write opt-in required')
const expect = baseExpect.configure({ timeout: 25_000 })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/Bogota', colorScheme: 'light' })
const page = await context.newPage()
const api = new StudySessionSmokeApi(context)
page.setDefaultTimeout(25_000)

const checks: string[] = []
const responses: { path: string; method: string; status: number; noStore: boolean }[] = []
const responseTasks: Promise<void>[] = []
let stage = 'anonymous route', cleaned = false, pageErrors = 0, cspWarnings = 0
page.on('pageerror', () => { pageErrors++ })
page.on('console', message => { if (message.text().includes('Content Security Policy')) cspWarnings++ })
page.on('response', response => {
  if (!response.url().includes('/api/v1/')) return
  responseTasks.push((async () => {
    const headers = await response.allHeaders()
    responses.push({ path: new URL(response.url()).pathname, method: response.request().method(), status: response.status(), noStore: !!headers['cache-control']?.includes('no-store') })
  })())
})

function localInput(hoursAhead: number) {
  const date = new Date(Date.now() + hoursAhead * 3_600_000)
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}
const inputFor = (hours: number): StudySessionWrite => ({ subject_id: 0, activity_id: null, planned_start_at: new Date(Date.now() + hours * 3_600_000).toISOString(), planned_duration: 45 })
async function pace() { await page.waitForTimeout(2_000) }
type ResponsePredicate = Parameters<typeof page.waitForResponse>[0]
async function actWithResponse(action: () => Promise<unknown>, predicate: ResponsePredicate) {
  const [response] = await Promise.all([page.waitForResponse(predicate), action()])
  return response
}
async function createThroughForm(subjectId: number, activityId: number | null, hoursAhead = 1) {
  await pace()
  await page.goto(production + '/app/sessions/new')
  await page.getByLabel('Materia', { exact: true }).waitFor()
  await page.getByLabel('Materia', { exact: true }).selectOption(String(subjectId))
  const activity = page.getByLabel('Actividad (opcional)', { exact: true })
  if (activityId !== null) {
    await expect(activity.locator(`option[value="${activityId}"]`)).toBeAttached()
    await activity.selectOption(String(activityId))
  } else await activity.selectOption('')
  await page.getByLabel('Fecha y hora planificadas', { exact: true }).fill(localInput(hoursAhead))
  const result = await actWithResponse(
    () => page.getByRole('button', { name: 'Crear sesi\u00f3n planificada', exact: true }).click(),
    item => new URL(item.url()).pathname.endsWith('/sessions') && item.request().method() === 'POST',
  )
  check(result.status() === 201, 'UI create session HTTP 201')
  const item = await result.json() as StudySession
  api.sessions.add(item.id)
  await expect(page.getByRole('heading', { name: /Sesi\u00f3n de / })).toBeVisible()
  return item
}
async function finishThroughDialog(result: 'completed' | 'partial' | 'postponed' | 'cancelled', context?: 'finished_early' | 'distracted' | 'tired' | 'interrupted' | 'changed_activity' | 'other', otherText?: string) {
  const trigger = page.getByRole('button', { name: /Finalizar sesi\u00f3n|Postergar o cancelar/ })
  await trigger.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  const results = dialog.getByLabel('Resultado', { exact: true })
  await results.selectOption(result)
  if (context) await dialog.getByLabel(/¿C\u00f3mo termin\u00f3\?/).selectOption(context)
  if (context === 'other') await dialog.getByLabel('Cu\u00e9ntanos brevemente (opcional)').fill(otherText ?? '')
  await dialog.getByRole('checkbox', { name: /Confirmo que deseo finalizar/ }).check()
  const received = await actWithResponse(
    () => dialog.getByRole('button', { name: 'Confirmar resultado', exact: true }).click(),
    item => new URL(item.url()).pathname.endsWith('/finish') && item.request().method() === 'POST',
  )
  check(received.status() === 200, 'UI finish HTTP 200')
  return await received.json() as StudySession
}
async function deleteUnstartedThroughUi(plan: StudySession) {
  await pace()
  await page.goto(production + `/app/sessions/${plan.id}`)
  const trigger = page.getByRole('button', { name: 'Eliminar plan sin iniciar', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Eliminar plan', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await dialog.getByRole('checkbox').check()
  const response = await actWithResponse(
    () => dialog.getByRole('button', { name: 'Eliminar plan', exact: true }).click(),
    received => received.request().method() === 'DELETE' && new URL(received.url()).pathname.endsWith(`/sessions/${plan.id}`),
  )
  check(response.status() === 204, 'UI delete unstarted plan HTTP 204')
  api.deletedSessions.add(plan.id)
  await api.request('deleted_plan_not_found', `sessions/${plan.id}`, 404)
}

try {
  await mkdir('.local', { recursive: true })
  await page.goto(production + '/app/sessions')
  await expect(page).toHaveURL(/\/login$/)
  checks.push('auth: anonymous route redirected to login')

  stage = 'synthetic account and fixtures'
  await api.bootstrap()
  const subject = await api.create('Sesiones UI uno')
  const otherSubject = await api.create('Sesiones UI dos')
  const activity = await api.createActivity(subject.id)
  await page.goto(production + '/app/sessions')
  await expect(page.getByRole('heading', { name: 'Sesiones de estudio', exact: true })).toBeVisible()
  await expect(page.getByText('No hay sesiones con estos filtros', { exact: true })).toBeVisible()
  checks.push('authenticated session list and empty state')

  stage = 'create/edit with compatible optional activity'
  const mainPlan = await createThroughForm(subject.id, activity.id)
  await expect(page.getByText('Smoke de sesi\u00f3n', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Editar planificaci\u00f3n', exact: true }).click()
  await page.getByLabel('Duraci\u00f3n planificada (minutos)', { exact: true }).fill('60')
  await page.getByLabel('Fecha y hora planificadas', { exact: true }).fill(localInput(2))
  const updateResponse = await actWithResponse(
    () => page.getByRole('button', { name: 'Guardar planificaci\u00f3n', exact: true }).click(),
    item => new URL(item.url()).pathname.endsWith(`/sessions/${mainPlan.id}`) && item.request().method() === 'PUT',
  )
  check(updateResponse.status() === 200, 'UI planning update HTTP 200')
  await expect(page.getByText('60 minutos', { exact: true })).toBeVisible()
  const mismatch = inputFor(3); mismatch.subject_id = otherSubject.id; mismatch.activity_id = activity.id
  await api.request('reject_activity_for_other_subject', 'sessions', 404, 'POST', mismatch)
  checks.push('create with compatible activity; edit plan; mismatched subject/activity is hidden with 404')

  stage = 'activity optional and safe delete'
  const noActivityPlan = await createThroughForm(subject.id, null, 3)
  check(noActivityPlan.activity_id === null, 'activity is optional')
  await deleteUnstartedThroughUi(noActivityPlan)
  checks.push('activity omitted; confirmed UI delete of unstarted plan')

  stage = 'start and running recovery'
  await pace(); await page.goto(production + `/app/sessions/${mainPlan.id}`)
  const startButton = page.getByRole('button', { name: 'Iniciar sesi\u00f3n', exact: true })
  const startResponse = await actWithResponse(async () => { await startButton.focus(); await page.keyboard.press('Enter') }, item => new URL(item.url()).pathname.endsWith(`/sessions/${mainPlan.id}/start`))
  check(startResponse.status() === 200, 'keyboard start HTTP 200')
  await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible()
  await page.waitForTimeout(1_300)
  await expect(page.locator('output[aria-label^="Tiempo efectivo"]')).toBeVisible()
  await pace(); await page.reload()
  await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible()
  check(await page.getByText(/Estimaci\u00f3n en curso/).count() === 1, 'running timer recovers from API after refresh')
  checks.push('start and refresh recovery while running; provisional timer visible')

  stage = 'first pause and competing-session conflict'
  const pauseResponse = await actWithResponse(async () => { await page.getByRole('button', { name: 'Pausar', exact: true }).focus(); await page.keyboard.press('Enter') }, item => new URL(item.url()).pathname.endsWith(`/sessions/${mainPlan.id}/pause`))
  check(pauseResponse.status() === 200, 'keyboard pause HTTP 200')
  const competitor = await api.createSession({ ...inputFor(4), subject_id: subject.id, activity_id: null })
  await pace(); await page.goto(production + `/app/sessions/${competitor.id}`)
  const conflictResponse = await actWithResponse(() => page.getByRole('button', { name: 'Iniciar sesi\u00f3n', exact: true }).click(), item => new URL(item.url()).pathname.endsWith(`/sessions/${competitor.id}/start`))
  check(conflictResponse.status() === 409, 'second active session is rejected with 409')
  await expect(page.getByRole('alert')).toContainText('ya hay otra en curso')
  await expect(page.getByText('Planificada', { exact: true })).toBeVisible()
  await deleteUnstartedThroughUi(competitor)
  checks.push('one active session per user; conflict 409 rendered safely; plan preserved then deleted')

  stage = 'paused refresh and multiple intervals'
  await pace(); await page.goto(production + `/app/sessions/${mainPlan.id}`)
  await expect(page.getByRole('button', { name: 'Reanudar', exact: true })).toBeVisible()
  await page.goto(production + '/app/sessions')
  await expect(page.getByRole('heading', { name: 'Tu temporizador est\u00e1 en pausa', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tu temporizador est\u00e1 en pausa', exact: true })).toBeVisible()
  await pace(); await page.goto(production + `/app/sessions/${mainPlan.id}`)
  const firstResume = await actWithResponse(() => page.getByRole('button', { name: 'Reanudar', exact: true }).click(), item => new URL(item.url()).pathname.endsWith(`/sessions/${mainPlan.id}/resume`))
  check(firstResume.status() === 200, 'resume HTTP 200')
  await page.waitForTimeout(1_300)
  const secondPause = await actWithResponse(() => page.getByRole('button', { name: 'Pausar', exact: true }).click(), item => new URL(item.url()).pathname.endsWith(`/sessions/${mainPlan.id}/pause`))
  check(secondPause.status() === 200, 'second pause HTTP 200')
  await expect(page.getByRole('heading', { name: 'Intervalos de ejecuci\u00f3n', exact: true })).toBeVisible()
  check(await page.getByRole('list').filter({ has: page.getByText(/Tramo/) }).count() >= 1, 'interval history displayed')
  checks.push('paused session recovered after route change and refresh; multiple execution intervals visible')

  stage = 'finish partial with other context'
  const secondResume = await actWithResponse(() => page.getByRole('button', { name: 'Reanudar', exact: true }).click(), item => new URL(item.url()).pathname.endsWith(`/sessions/${mainPlan.id}/resume`))
  check(secondResume.status() === 200, 'second resume HTTP 200')
  await page.waitForTimeout(1_300)
  const partial = await finishThroughDialog('partial', 'other', 'Interrupci\u00f3n sint\u00e9tica de validaci\u00f3n')
  check(partial.status === 'partial' && partial.context === 'other' && partial.other_text === 'Interrupci\u00f3n sint\u00e9tica de validaci\u00f3n', 'partial result and other context stored')
  check(partial.intervals.length === 3, 'three intervals after two pauses')
  assertSameDuration(partial.actual_duration, partial.intervals)
  check(Number(partial.actual_duration) >= 2.5, 'effective time accumulated across intervals')
  await expect(page.getByText('Parcial', { exact: true })).toBeVisible()
  await expect(page.getByText('Interrupci\u00f3n sint\u00e9tica de validaci\u00f3n', { exact: true })).toBeVisible()
  checks.push('partial/other result; text; three closed intervals; effective duration equals interval sum excluding pauses')

  stage = 'delete historical session rejected'
  await api.request('history_delete_conflict', `sessions/${mainPlan.id}?confirm=true`, 409, 'DELETE')
  const afterRejectedDelete = await api.request<StudySession>('session_after_delete_conflict', `sessions/${mainPlan.id}`, 200)
  check(afterRejectedDelete.intervals.length === 3 && afterRejectedDelete.status === 'partial', 'history remains after rejected delete')
  checks.push('DELETE with execution history returns 409 and preserves session/intervals')

  stage = 'completed result and context'
  const completedPlan = await api.createSession({ ...inputFor(5), subject_id: subject.id, activity_id: null })
  await pace(); await page.goto(production + `/app/sessions/${completedPlan.id}`)
  const completedStart = await actWithResponse(() => page.getByRole('button', { name: 'Iniciar sesi\u00f3n', exact: true }).click(), item => new URL(item.url()).pathname.endsWith(`/sessions/${completedPlan.id}/start`))
  check(completedStart.status() === 200, 'completed session start HTTP 200')
  await page.waitForTimeout(1_100)
  const completed = await finishThroughDialog('completed', 'finished_early')
  check(completed.status === 'completed' && completed.context === 'finished_early', 'completed result and context stored')
  checks.push('completed result and finished-early context')

  stage = 'postponed and cancelled without execution'
  for (const result of ['postponed', 'cancelled'] as const) {
    const plan = await api.createSession({ ...inputFor(6), subject_id: subject.id, activity_id: null })
    await pace(); await page.goto(production + `/app/sessions/${plan.id}`)
    const finished = await finishThroughDialog(result)
    check(finished.status === result && finished.start_at === null && finished.intervals.length === 0, result + ' without execution')
  }
  checks.push('postponed and cancelled plans finalized without start or intervals')

  stage = 'list, detail, refresh, responsive, security'
  await pace(); await page.goto(production + `/app/sessions/${mainPlan.id}`); await page.reload()
  await expect(page.getByRole('heading', { name: /Sesi\u00f3n de Sesiones UI uno/ })).toBeVisible()
  await expect(page.getByText('Parcial', { exact: true })).toBeVisible()
  await page.screenshot({ path: '.local/study-session-detail-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile session detail has no horizontal overflow')
  await page.screenshot({ path: '.local/study-session-detail-mobile.png', fullPage: true })
  await pace(); await page.goto(production + '/app/sessions')
  const sessionsList = page.getByRole('list', { name: 'Lista de sesiones' })
  await expect(sessionsList).toBeVisible()
  await expect(sessionsList.getByText('Parcial', { exact: true })).toBeVisible()
  await page.screenshot({ path: '.local/study-sessions-list-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: '.local/study-sessions-list-desktop.png', fullPage: true })
  const cookies = await context.cookies()
  for (const name of ['cognova_refresh', 'cognova_csrf']) {
    const cookie = cookies.find(item => item.name === name)
    check(!!cookie?.secure && cookie.sameSite === 'Lax' && cookie.domain === 'cognova-frontend.netlify.app', 'auth cookie security attributes')
    check(cookie.httpOnly === (name === 'cognova_refresh'), 'HttpOnly attribute')
    check(cookie.path === (name === 'cognova_refresh' ? '/api/v1/auth' : '/'), 'auth cookie path')
  }
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), readableCookies: document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]) }))
  check(storage.local.every(key => key === 'cognova.theme') && !storage.session.length && !storage.readableCookies.includes('cognova_refresh'), 'credentials are not stored in Web Storage/readable cookies')
  await Promise.all(responseTasks)
  check(responses.length > 0 && responses.every(item => item.noStore), 'all browser API responses carry no-store')
  check(pageErrors === 0, 'no unhandled browser JavaScript errors')
  checks.push('list/detail/refresh; 1440/375 responsive; keyboard dialogs; auth cookies/storage; no-store; no uncaught JS errors')

  stage = 'session revocation and synthetic cleanup'
  await api.cleanupSessionsAndLogout(); cleaned = true
  await page.goto(production + '/app/sessions')
  await expect(page).toHaveURL(/\/login$/)
  checks.push('all synthetic sessions closed or retained as history; deletable fixtures removed; auth session revoked')
} catch (error) {
  const safeDiagnostic = error instanceof Error ? `${error.name}: ${error.message.split(/\r?\n/, 1)[0].slice(0, 180)}` : 'unexpected failure'
  console.error('Study Sessions browser smoke stopped at: ' + stage + '; API operation: ' + api.operation + '; diagnostic: ' + safeDiagnostic + (api.lastFailure ? '; safe API diagnostic: ' + api.lastFailure : ''))
  await page.screenshot({ path: '.local/study-sessions-failure.png', fullPage: true }).catch(() => undefined)
  process.exitCode = 1
} finally {
  if (!cleaned && api.userId) {
    try { await api.cleanupSessionsAndLogout(); cleaned = true }
    catch { console.error('Synthetic session cleanup needs follow-up'); process.exitCode = 1 }
  }
  await Promise.allSettled(responseTasks)
  const evidence = { date: new Date().toISOString(), passed: !process.exitCode, stage, userId: api.userId, sessionIds: [...api.sessions], deletedSessionIds: [...api.deletedSessions], retainedSessionIds: api.retainedSessions, subjectIds: [...api.subjects], activityIds: [...api.activities], cleaned, pageErrors, cspWarnings, checks, responses, api: api.evidence }
  await writeFile('.local/study-sessions-browser-smoke.json', JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify({ passed: !process.exitCode, stage, retainedSessionIds: api.retainedSessions, deletedSessionIds: [...api.deletedSessions], cleaned, pageErrors, cspWarnings, checks }))
  await browser.close()
}
