import { chromium, expect as baseExpect } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { StudySessionSmokeApi, production } from './StudySessionSmokeApi.ts'
import { check } from './SubjectSmokeApi.ts'
import type { Activity, ActivityList } from '../src/types/activity.ts'
import type { CalendarMixedPage } from '../src/types/calendar.ts'
import type { StudySessionList } from '../src/types/studySession.ts'

check(process.env.SMOKE_ALLOW_PRODUCTION_WRITE === '1', 'Explicit production write opt-in required')
const expect = baseExpect.configure({ timeout: 25_000 })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/Bogota', colorScheme: 'light' })
const page = await context.newPage()
const api = new StudySessionSmokeApi(context)
page.setDefaultTimeout(25_000)

const checks: string[] = []
const responses: { path: string; search: string; method: string; status: number; noStore: boolean }[] = []
const responseTasks: Promise<void>[] = []
const activityIds: number[] = [], sessionIds: number[] = [], subjectIds: number[] = []
let stage = 'anonymous route', cleaned = false, pageErrors = 0, consoleErrors = 0, cspWarnings = 0
let beforeHash = '', afterHash = ''
page.on('pageerror', () => { pageErrors++ })
page.on('console', message => {
  if (message.text().includes('Content Security Policy')) cspWarnings++
  else if (message.type() === 'error') consoleErrors++
})
page.on('response', response => {
  if (!response.url().includes('/api/v1/')) return
  responseTasks.push((async () => {
    const headers = await response.allHeaders(), url = new URL(response.url())
    responses.push({ path: url.pathname, search: url.search, method: response.request().method(), status: response.status(), noStore: !!headers['cache-control']?.includes('no-store') })
  })())
})

const localParts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).formatToParts(date).map(part => [part.type, part.value]))
const calendarLink = (kind: 'activities' | 'sessions', id: number) => page.locator(`a[href="/app/${kind}/${id}"]`)
const viewReady = async (view: 'mensual' | 'semanal') => expect(page.getByRole('region', { name: 'Vista ' + view, exact: true })).toBeVisible()
async function readOnlySnapshot() {
  const [activities, sessions] = await Promise.all([
    api.request<ActivityList>('snapshot_activities', 'activities?limit=100', 200),
    api.request<StudySessionList>('snapshot_sessions', 'sessions?limit=100', 200),
  ])
  return JSON.stringify({ activities: activities.items, sessions: sessions.items })
}
async function screenshot(name: string) {
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow')
  await page.screenshot({ path: `.local/calendar-mixed-${name}.png`, fullPage: true })
}

const future = localParts(new Date(Date.now() + 72 * 60 * 60 * 1000))
const instant = new Date(`${future.year}-${future.month}-${future.day}T15:00:00-05:00`)
const later = new Date(instant.getTime() + 45 * 60_000)
const day = localParts(instant)
const dateKey = `${day.year}-${day.month}-${day.day}`
const iso = instant.toISOString(), laterIso = later.toISOString()

try {
  await mkdir('.local', { recursive: true })
  await page.goto(`${production}/app/calendar?date=${dateKey}&view=month`)
  await expect(page).toHaveURL(/\/login$/)
  checks.push('auth: anonymous direct calendar route redirected to login')

  stage = 'synthetic account and mixed fixtures'
  await api.bootstrap()
  const subject = await api.create('Calendario mixto uno')
  const secondSubject = await api.create('Calendario mixto dos')
  subjectIds.push(subject.id, secondSubject.id)
  const activity = await api.request<Activity>('synthetic_activity_same_instant', 'activities', 201, 'POST', {
    title: 'Actividad calendario mixta', subject_id: subject.id, deadline: iso, priority: 'high', status: 'pending', estimated_duration: 30, notes: 'Synthetic read-only calendar validation',
  })
  api.activities.add(activity.id); activityIds.push(activity.id)
  const secondActivity = await api.request<Activity>('synthetic_activity_filtered', 'activities', 201, 'POST', {
    title: 'Actividad calendario filtrada', subject_id: secondSubject.id, deadline: laterIso, priority: 'urgent', status: 'in_progress', estimated_duration: 25, notes: 'Synthetic read-only calendar validation',
  })
  api.activities.add(secondActivity.id); activityIds.push(secondActivity.id)
  const session = await api.createSession({ subject_id: subject.id, activity_id: activity.id, planned_start_at: iso, planned_duration: 45 })
  const secondSession = await api.createSession({ subject_id: secondSubject.id, activity_id: null, planned_start_at: laterIso, planned_duration: 30 })
  sessionIds.push(session.id, secondSession.id)

  stage = 'backend mixed ordering and filters'
  const from = new Date(`${dateKey}T00:00:00-05:00`).toISOString()
  const to = new Date(new Date(`${dateKey}T00:00:00-05:00`).getTime() + 86_400_000).toISOString()
  const query = new URLSearchParams({ deadline_from: from, deadline_to: to, limit: '50' })
  const all = await api.request<CalendarMixedPage>('calendar_mixed_items', `calendar?${query}`, 200)
  const sameInstant = all.items.filter(item => item.type === 'activity' && item.id === activity.id || item.type === 'study_session' && item.id === session.id)
  check(sameInstant.length === 2 && sameInstant[0].type === 'activity' && sameInstant[1].type === 'study_session', 'backend order is stable when activity/session share instant')
  const onlyActivities = await api.request<CalendarMixedPage>('calendar_activity_filter', `calendar?${query}&type=activity`, 200)
  const onlySessions = await api.request<CalendarMixedPage>('calendar_session_filter', `calendar?${query}&type=study_session`, 200)
  check(onlyActivities.items.every(item => item.type === 'activity'), 'type=activity returns only activities')
  check(onlySessions.items.every(item => item.type === 'study_session'), 'type=study_session returns only study sessions')
  checks.push('GET /calendar mixed response, discriminated types, type filters, same-instant Backend ordering')

  stage = 'read-only baseline'
  beforeHash = createHash('sha256').update(await readOnlySnapshot()).digest('hex')
  stage = 'monthly view and same-instant rendering'
  await page.goto(`${production}/app/calendar?date=${dateKey}&view=month`)
  await viewReady('mensual')
  const activityLink = calendarLink('activities', activity.id), sessionLink = calendarLink('sessions', session.id)
  await expect(activityLink).toBeVisible()
  await expect(sessionLink).toBeVisible()
  await expect(sessionLink).toContainText('Materia: Calendario mixto uno')
  await expect(sessionLink).toContainText('Duración planificada: 45 minutos')
  await expect(sessionLink).toContainText('Planificada')
  const sameDay = page.locator('section[aria-label]').filter({ has: activityLink })
  const dayLinks = await sameDay.locator('a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).getAttribute('href')))
  check(dayLinks.indexOf(`/app/activities/${activity.id}`) < dayLinks.indexOf(`/app/sessions/${session.id}`), 'same-instant calendar rendering preserves Backend tie order')
  await expect(calendarLink('activities', secondActivity.id)).toBeVisible()
  await expect(calendarLink('sessions', secondSession.id)).toBeVisible()
  checks.push('monthly view places activity by deadline and session by planned_start_at; session details visible')

  stage = 'subject and type filters'
  await page.getByLabel('Filtrar por materia').selectOption(String(subject.id))
  await expect(activityLink).toBeVisible(); await expect(sessionLink).toBeVisible()
  await expect(calendarLink('activities', secondActivity.id)).toHaveCount(0)
  await expect(calendarLink('sessions', secondSession.id)).toHaveCount(0)
  await page.getByLabel('Filtrar por materia').selectOption('')
  await page.getByLabel('Filtrar por tipo').selectOption('activity')
  await expect(activityLink).toBeVisible(); await expect(sessionLink).toHaveCount(0)
  await expect(calendarLink('activities', secondActivity.id)).toBeVisible()
  await page.getByLabel('Filtrar por tipo').selectOption('study_session')
  await expect(sessionLink).toBeVisible(); await expect(activityLink).toHaveCount(0)
  await expect(calendarLink('sessions', secondSession.id)).toBeVisible()
  await expect(page.getByLabel('Filtrar por estado')).toHaveCount(0)
  await expect(page.getByLabel('Filtrar por prioridad')).toHaveCount(0)
  const sessionUrl = new URL(page.url())
  check(sessionUrl.searchParams.get('type') === 'study_session' && !sessionUrl.searchParams.has('status') && !sessionUrl.searchParams.has('priority'), 'session-only URL omits activity status and priority')
  const sessionCalendarResponse = responses.filter(response => response.path.endsWith('/calendar') && response.search.includes('type=study_session')).at(-1)
  check(!!sessionCalendarResponse && !sessionCalendarResponse.search.includes('status=') && !sessionCalendarResponse.search.includes('priority='), 'session-only API query omits activity filters')
  await page.getByLabel('Filtrar por tipo').selectOption('all')
  await page.getByLabel('Filtrar por estado').selectOption('pending')
  await page.getByLabel('Filtrar por prioridad').selectOption('high')
  await expect(activityLink).toBeVisible(); await expect(sessionLink).toHaveCount(0)
  await expect(calendarLink('activities', secondActivity.id)).toHaveCount(0)
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
  await expect(activityLink).toBeVisible(); await expect(sessionLink).toBeVisible()
  checks.push('subject filter applies to both; type filter; session filter clears/hides activity-only filters; status/priority filter activities')

  stage = 'weekly, URL and refresh'
  await page.getByRole('button', { name: 'Semana', exact: true }).click()
  await viewReady('semanal'); await expect(activityLink).toBeVisible(); await expect(sessionLink).toBeVisible()
  await page.getByLabel('Filtrar por tipo').selectOption('study_session')
  const persistentUrl = new URL(page.url())
  check(persistentUrl.searchParams.get('date') === dateKey && persistentUrl.searchParams.get('view') === 'week' && persistentUrl.searchParams.get('type') === 'study_session', 'URL persists date, week and type filter')
  await page.reload(); await viewReady('semanal')
  await expect(page.getByLabel('Filtrar por tipo')).toHaveValue('study_session')
  await expect(sessionLink).toBeVisible(); await expect(activityLink).toHaveCount(0)
  await page.goto(`${production}/app/calendar?date=${dateKey}&view=week&type=all&subject_id=${subject.id}`)
  await viewReady('semanal'); await expect(activityLink).toBeVisible(); await expect(sessionLink).toBeVisible()
  checks.push('weekly view, date/view/type URL persistence, refresh and direct route')

  stage = 'keyboard navigation to original details'
  await activityLink.focus(); await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Actividad calendario mixta', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Editar actividad', exact: true })).toBeVisible()
  await page.goto(`${production}/app/calendar?date=${dateKey}&view=week`)
  await viewReady('semanal')
  const sessionDetailLink = calendarLink('sessions', session.id)
  await sessionDetailLink.focus(); await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: new RegExp('Sesión de Calendario mixto uno') })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Detalles de la sesión' })).toBeVisible()
  checks.push('keyboard Enter opens original Activity and Study Session detail routes')

  stage = 'responsive and accessibility'
  await page.goto(`${production}/app/calendar?date=${dateKey}&view=month`); await viewReady('mensual')
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 })
    for (const view of ['Mes', 'Semana']) {
      await page.getByRole('button', { name: view, exact: true }).click()
      await viewReady(view === 'Mes' ? 'mensual' : 'semanal')
      await expect(activityLink).toBeVisible(); await expect(sessionLink).toBeVisible()
      await screenshot(`${width}-${view.toLowerCase()}`)
    }
  }
  const typeFilter = page.getByLabel('Filtrar por tipo')
  await typeFilter.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter')
  check(await typeFilter.evaluate(element => document.activeElement === element), 'type filter retains keyboard focus')
  checks.push('desktop/mobile month/week layouts have no horizontal overflow; links and filters remain keyboard accessible')

  stage = 'read-only, auth and cache policy'
  afterHash = createHash('sha256').update(await readOnlySnapshot()).digest('hex')
  check(beforeHash === afterHash, 'calendar reads did not mutate Activities or Sessions')
  const cookies = await context.cookies()
  for (const name of ['cognova_refresh', 'cognova_csrf']) {
    const cookie = cookies.find(item => item.name === name)
    check(!!cookie?.secure && cookie.sameSite === 'Lax' && cookie.domain === 'cognova-frontend.netlify.app', 'auth cookie security attributes')
    check(cookie.httpOnly === (name === 'cognova_refresh'), 'refresh cookie HttpOnly policy')
  }
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), readableCookies: document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]) }))
  check(storage.local.every(key => key === 'cognova.theme') && !storage.session.length && !storage.readableCookies.includes('cognova_refresh'), 'no credentials in Web Storage or readable cookies')
  await Promise.all(responseTasks)
  const calendarResponses = responses.filter(response => response.path.endsWith('/calendar'))
  check(calendarResponses.length > 0 && calendarResponses.every(response => response.method === 'GET' && response.status === 200), 'calendar requests are successful reads only')
  check(responses.every(response => response.noStore), 'all browser API responses carry no-store')
  check(pageErrors === 0 && consoleErrors === 0, 'no uncaught browser or console JavaScript errors')
  checks.push('resource snapshots unchanged; auth/session storage policy; no-store; zero JS/console errors')

  stage = 'synthetic cleanup and revoked route'
  await api.cleanupSessionsAndLogout(); cleaned = true
  await page.goto(`${production}/app/calendar?date=${dateKey}&view=month`)
  await expect(page).toHaveURL(/\/login$/)
  checks.push('synthetic plans, activities and subjects cleaned; session revoked; protected calendar route redirects')
} catch (error) {
  const diagnostic = error instanceof Error ? `${error.name}: ${error.message.split(/\r?\n/).slice(0, 3).join(' | ').slice(0, 300)}` : 'unexpected failure'
  console.error(`Calendar mixed smoke stopped at ${stage}; API operation ${api.operation}; ${diagnostic}${api.lastFailure ? `; ${api.lastFailure}` : ''}`)
  await page.screenshot({ path: '.local/calendar-mixed-failure.png', fullPage: true }).catch(() => undefined)
  process.exitCode = 1
} finally {
  if (!cleaned && api.userId) {
    try { await api.cleanupSessionsAndLogout(); cleaned = true }
    catch (error) {
      const diagnostic = api.lastFailure || (error instanceof Error ? error.message.split(/\r?\n/, 1)[0].slice(0, 180) : 'cleanup failed')
      console.error('Synthetic calendar cleanup needs follow-up: ' + diagnostic)
      process.exitCode = 1
    }
  }
  await Promise.allSettled(responseTasks)
  const evidence = { date: new Date().toISOString(), passed: !process.exitCode, stage, userId: api.userId, activityIds, sessionIds, subjectIds, cleaned, pageErrors, consoleErrors, cspWarnings, beforeHash, afterHash, checks, responses, api: api.evidence }
  await writeFile('.local/calendar-mixed-browser-smoke.json', JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify({ passed: !process.exitCode, stage, cleaned, pageErrors, consoleErrors, cspWarnings, checks }))
  await browser.close()
}
