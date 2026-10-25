import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { ActivitySmokeApi } from './ActivitySmokeApi.ts'
import { production, check } from './SubjectSmokeApi.ts'
import type { Activity, DeadlineHistory } from '../src/types/activity.ts'
check(process.env.SMOKE_ALLOW_PRODUCTION_WRITE === '1', 'Explicit production write opt-in required')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/Bogota', colorScheme: 'light' })
const api = new ActivitySmokeApi(context), page = await context.newPage()
page.setDefaultTimeout(20000)
let stage = 'setup', passed = false, closed = false, retainedId = 0, deletedId = 0, pageErrors = 0, cspWarnings = 0
const checks: string[] = [], responses: { method: string; path: string; status: number; noStore: boolean }[] = [], tasks: Promise<void>[] = []
page.on('pageerror', () => pageErrors++)
page.on('console', message => { if (message.text().includes('Content Security Policy')) cspWarnings++ })
page.on('response', response => {
  if (!response.url().includes('/api/v1/')) return
  const record = async () => {
    const headers = await response.allHeaders()
    responses.push({ method: response.request().method(), path: new URL(response.url()).pathname, status: response.status(), noStore: !!headers['cache-control']?.includes('no-store') })
  }
  tasks.push(record())
})
async function create(title: string) {
  await page.goto(production + '/app/activities/new')
  await page.getByLabel('Título', { exact: true }).fill(title)
  await page.getByLabel('Fecha límite', { exact: true }).fill('2030-01-01T12:00')
  await page.getByLabel('Duración estimada (min)', { exact: true }).fill('45')
  await page.getByLabel('Notas (opcional)', { exact: true }).fill('Evidencia sintética de interfaz.')
  const pending = page.waitForResponse(r => r.url().endsWith('/api/v1/activities') && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Crear actividad', exact: true }).click()
  const response = await pending; check(response.status() === 201, 'UI create201')
  const item: Activity = await response.json(); await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  return item
}
try {
  await mkdir('.local', { recursive: true }); await api.bootstrap(); await api.create('Actividades UI')
  stage = 'create/edit'
  const first = await create('Lectura de prueba'); retainedId = first.id
  await page.getByRole('button', { name: 'Editar actividad', exact: true }).click()
  await page.getByLabel('Título', { exact: true }).fill('Lectura revisada')
  await page.getByLabel('Prioridad', { exact: true }).selectOption('high')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page.getByText('Cambios guardados.', { exact: true })).toBeVisible(); checks.push('create201; edit200')
  stage = 'filters'
  await page.getByRole('link', { name: '← Actividades', exact: true }).click()
  await page.getByLabel('Filtrar por materia').selectOption(String(first.subject_id)); await page.getByLabel('Filtrar por estado').selectOption('pending'); await page.getByLabel('Filtrar por prioridad').selectOption('high')
  await page.getByLabel('Desde', { exact: true }).fill('2030-01-01T00:00'); await page.getByLabel('Hasta (incluido)').fill('2030-01-02T00:00')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click(); await expect(page.getByRole('heading', { name: 'Lectura revisada' })).toBeVisible()
  await page.getByLabel('Filtrar por prioridad').selectOption('urgent'); await page.getByRole('button', { name: 'Aplicar filtros' }).click(); await expect(page.getByText('No hay actividades con estos filtros')).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar filtros' }).click(); await expect(page.getByRole('heading', { name: 'Lectura revisada' })).toBeVisible()
  await page.getByLabel('Fecha límite', { exact: true }).selectOption('exact'); await page.getByLabel('Fecha y hora', { exact: true }).fill('2030-01-01T12:00'); await page.getByRole('button', { name: 'Aplicar filtros' }).click(); await expect(page.getByRole('heading', { name: 'Lectura revisada' })).toBeVisible()
  checks.push('subject/status/priority/range/exact filters; empty; clear')
  stage = 'status/deadline/history'
  await page.getByRole('link').filter({ has: page.getByRole('heading', { name: 'Lectura revisada' }) }).click()
  await page.getByLabel('Nuevo estado').selectOption('in_progress'); await page.getByRole('button', { name: 'Guardar estado', exact: true }).click(); await expect(page.getByText('Estado actualizado.', { exact: true })).toBeVisible()
  await page.getByLabel('Nueva fecha límite').fill('2030-01-03T12:00'); await page.getByRole('button', { name: 'Guardar fecha límite', exact: true }).click(); await expect(page.getByText('Fecha postergada', { exact: true })).toBeVisible()
  await page.getByLabel('Nueva fecha límite').fill('2030-01-02T12:00'); await page.getByRole('button', { name: 'Guardar fecha límite', exact: true }).click(); await expect(page.getByText('Fecha adelantada', { exact: true })).toBeVisible()
  const current = await api.request<Activity>('original_preserved', 'activities/' + first.id, 200)
  check(current.original_deadline === first.original_deadline && current.deadline_revision === 2 && current.status === 'in_progress', 'immutable original and independent state')
  const history = await api.request<DeadlineHistory>('history_verified', 'activities/' + first.id + '/deadline-history', 200)
  check(history.items.length === 2 && history.items[0].event_type === 'postponed' && history.items[1].event_type === 'rescheduled', 'event directions')
  await expect(page.getByText('Fecha original', { exact: true })).toBeVisible(); checks.push('state; postponed/rescheduled history; original preserved')
  stage = 'visual desktop/mobile'
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 })
    for (const dark of [false, true]) {
      const toggle = page.getByRole('button', { name: /Modo oscuro/ }); if ((await toggle.getAttribute('aria-pressed') === 'true') !== dark) await toggle.click()
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow')
      await page.screenshot({ path: '.local/activities-' + width + '-' + (dark ? 'dark' : 'light') + '.png', fullPage: true })
    }
  }
  checks.push('1440/375 light/dark; no overflow')
  stage = 'DELETE409 and keyboard cancellation'
  const trigger = page.getByRole('button', { name: 'Eliminar actividad', exact: true })
  await trigger.focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.keyboard.press('Enter'); await page.getByRole('checkbox').focus(); await page.keyboard.press('Space')
  const blocked = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().includes('/activities/' + first.id))
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).focus(); await page.keyboard.press('Enter'); check((await blocked).status() === 409, 'history DELETE409')
  await expect(page.getByRole('alert')).toContainText('no puede eliminarse'); await page.screenshot({ path: '.local/activities-delete409-mobile.png', fullPage: true })
  const cancel = page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }); await cancel.focus(); await page.keyboard.press('Enter'); await expect(trigger).toBeFocused()
  const after = await api.request<Activity>('retained_after409', 'activities/' + first.id, 200); check(JSON.stringify(after) === JSON.stringify(current), 'activity unchanged by DELETE409'); checks.push('DELETE409 explains preservation; keyboard Escape/Cancel focus')
  stage = 'refresh/direct route'
  await page.reload(); await expect(page.getByRole('heading', { name: 'Lectura revisada' })).toBeVisible(); await expect(page.getByText('Fecha adelantada', { exact: true })).toBeVisible()
  await page.goto(production + '/app/activities/' + first.id); await expect(page.getByRole('heading', { name: 'Lectura revisada' })).toBeVisible(); checks.push('refresh session restore; direct route/history')
  stage = 'DELETE204'
  const second = await create('Eliminar prueba'); deletedId = second.id
  await page.getByRole('button', { name: 'Eliminar actividad', exact: true }).click(); const confirm = page.getByRole('button', { name: 'Eliminar definitivamente' }); await expect(confirm).toBeDisabled()
  await page.getByRole('checkbox').focus(); await page.keyboard.press('Space')
  const removed = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().includes('/activities/' + second.id))
  await confirm.focus(); await page.keyboard.press('Enter'); check((await removed).status() === 204, 'DELETE204'); await expect(page.getByText('Actividad eliminada.', { exact: true })).toBeVisible()
  await api.request('deleted_get404', 'activities/' + second.id, 404); await api.request('deleted_repeat404', 'activities/' + second.id + '?confirm=true', 404, 'DELETE')
  await expect(page.getByRole('heading', { name: 'Eliminar prueba', exact: true })).toHaveCount(0); checks.push('confirmed keyboard DELETE204; GET/repeat404; list absence')
  stage = 'security/cleanup'
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })); check(storage.local.every(k => k === 'cognova.theme') && !storage.session.length, 'no auth data in storage')
  for (const name of ['cognova_refresh', 'cognova_csrf']) { const c = (await context.cookies()).find(c => c.name === name); check(c?.secure && c.sameSite === 'Lax' && c.domain === 'cognova-frontend.netlify.app' && c.httpOnly === (name === 'cognova_refresh'), 'secure cookies') }
  await api.cleanup(); closed = true; await page.reload(); await expect(page).toHaveURL(/\/login$/)
  await Promise.all(tasks); check(responses.length > 0 && responses.every(r => r.noStore), 'API no-store'); check(pageErrors === 0, 'no browser exceptions')
  checks.push('auth restore; CSRF; no-store; revoked logout; no token storage'); passed = true
} catch {
  await page.screenshot({ path: '.local/activities-failure.png', fullPage: true }).catch(() => undefined)
  console.error('Activities browser smoke stopped at: ' + stage + '; API operation: ' + api.operation); process.exitCode = 1
} finally {
  try { if (!closed && api.userId) await api.cleanup() } catch { passed = false; process.exitCode = 1; console.error('Synthetic cleanup incomplete') }
  await writeFile('.local/activities-browser-smoke.json', JSON.stringify({ date: new Date().toISOString(), passed, stage, userId: api.userId, retainedId, deletedId, pageErrors, cspWarnings, checks, responses, api: api.evidence }, null, 2))
  console.log(JSON.stringify({ passed, stage, userId: api.userId, checks, pageErrors, cspWarnings })); await browser.close()
}
