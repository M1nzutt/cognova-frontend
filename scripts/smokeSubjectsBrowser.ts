/// <reference lib="dom" />
import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { SubjectSmokeApi, check, production } from './SubjectSmokeApi.ts'
import type { Subject, SubjectList } from '../src/types/subject.ts'
check(process.env.SMOKE_ALLOW_PRODUCTION_WRITE === '1', 'Explicit production opt-in required')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const otherContext = await browser.newContext()
const api = new SubjectSmokeApi(context), other = new SubjectSmokeApi(otherContext)
const page = await context.newPage()
page.setDefaultTimeout(15000)
let stage = 'bootstrap', apiClosed = false
let pageErrors = 0, cspViolations = 0
const apiResponses: { method: string; path: string; status: number; noStore: boolean }[] = []
const responseTasks: Promise<void>[] = []
page.on('pageerror', () => { pageErrors++ })
page.on('console', message => { if (message.text().includes('Content Security Policy')) cspViolations++ })
page.on('response', response => {
  if (!response.url().includes('/api/v1/')) return
  responseTasks.push((async () => {
    const headers = await response.allHeaders()
    apiResponses.push({ method: response.request().method(), path: new URL(response.url()).pathname, status: response.status(), noStore: !!headers['cache-control']?.includes('no-store') })
  })())
})
// Direct-route restores intentionally exercise auth; pace below the production rate limit.
async function visit(url: string) { await new Promise(resolve => setTimeout(resolve, 4000)); await page.goto(url) }
async function create(name: string) {
  stage = 'create ' + name
  await visit(production + '/app/subjects/new')
  await page.getByLabel('Nombre', { exact: true }).fill(name)
  await page.getByLabel('Dificultad', { exact: true }).selectOption('hard')
  const response = page.waitForResponse(r => r.url().endsWith('/api/v1/subjects') && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Crear materia', exact: true }).click()
  const received = await response; check(received.status() === 201, 'create HTTP')
  const item = await received.json() as Subject; api.owned.add(item.id)
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  return item
}
async function remove(id: number) {
  stage = 'delete confirmation'
  await visit(production + '/app/subjects/' + id)
  await page.getByRole('button', { name: 'Eliminar materia', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Eliminar definitivamente' })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Eliminar materia', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Eliminar materia', exact: true }).click()
  await dialog.getByRole('checkbox').check()
  await page.screenshot({ path: '.local/subjects-delete-confirmation.png', fullPage: true })
  const response = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().includes('/subjects/' + id))
  await dialog.getByRole('button', { name: 'Eliminar definitivamente' }).click()
  check((await response).status() === 204, 'delete HTTP')
  await expect(page.getByText('Materia eliminada.', { exact: true })).toBeVisible()
  await api.request('get_after_ui_delete', 'subjects/' + id, 404)
  await api.request('second_delete', 'subjects/' + id + '?confirm=true', 404, 'DELETE')
  api.owned.delete(id)
}
try {
  await mkdir('.local', { recursive: true })
  await api.bootstrap(); await other.bootstrap()
  const foreign = await other.create('Materia ajena')
  stage = 'empty and auth restore'
  await visit(production + '/app/subjects')
  await expect(page.getByText('Un espacio para tus materias', { exact: true })).toBeVisible()
  const first = await create('Álgebra UI')
  stage = 'duplicate'
  await visit(production + '/app/subjects/new')
  await page.getByLabel('Nombre', { exact: true }).fill(first.name)
  await page.getByRole('button', { name: 'Crear materia', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Ya existe una materia con ese nombre')
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(first.name)
  stage = 'edit'
  await visit(production + '/app/subjects/' + first.id)
  await page.getByRole('button', { name: 'Editar materia', exact: true }).click()
  await page.getByLabel('Nombre', { exact: true }).fill('Cálculo UI')
  await page.getByLabel('Color', { exact: true }).selectOption('green')
  await page.getByLabel('Tono', { exact: true }).selectOption('300')
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
  await expect(page.getByText('Cambios guardados.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Cálculo UI', exact: true })).toBeVisible()
  stage = 'archive/reactivate'
  await page.getByRole('button', { name: 'Archivar materia', exact: true }).click()
  await expect(page.getByText('Materia archivada.', { exact: true })).toBeVisible()
  await visit(production + '/app/subjects/archived')
  await expect(page.getByRole('heading', { name: 'Cálculo UI', exact: true })).toBeVisible()
  await visit(production + '/app/subjects/' + first.id)
  await page.getByRole('button', { name: 'Reactivar materia', exact: true }).click()
  await expect(page.getByText('Materia reactivada.', { exact: true })).toBeVisible()
  for (let i = 1; i <= 4; i++) await create('Materia UI ' + i)
  stage = 'five active and direct new route'
  await visit(production + '/app/subjects')
  await expect(page.getByText('5 de 5 materias activas. Las archivadas no ocupan cupo.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Nueva materia' })).toHaveCount(0)
  await page.screenshot({ path: '.local/subjects-desktop-light.png', fullPage: true })
  await page.getByRole('button', { name: /Modo oscuro/ }).click()
  await page.screenshot({ path: '.local/subjects-desktop-dark.png', fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile overflow')
  await page.screenshot({ path: '.local/subjects-mobile-dark.png', fullPage: true })
  await page.getByRole('button', { name: /Modo oscuro/ }).click()
  await page.screenshot({ path: '.local/subjects-mobile-light.png', fullPage: true })
  await visit(production + '/app/subjects/new')
  await expect(page.getByText('Ya tienes cinco materias activas. Archiva una antes de crear otra.')).toBeVisible()
  stage = 'archived excluded / no reactivation capacity'
  await visit(production + '/app/subjects/' + first.id)
  await page.getByRole('button', { name: 'Archivar materia', exact: true }).click()
  await expect(page.getByText('Materia archivada.', { exact: true })).toBeVisible()
  await create('Materia UI extra')
  await visit(production + '/app/subjects/' + first.id)
  await expect(page.getByRole('button', { name: 'Reactivar materia', exact: true })).toBeDisabled()
  await expect(page.getByText('No hay cupo para reactivar esta materia. Archiva otra primero.')).toBeVisible()
  stage = 'ownership and not found'
  await visit(production + '/app/subjects/' + foreign.id)
  await expect(page.getByRole('alert')).toContainText('No encontramos esta materia')
  await api.request('foreign_get', 'subjects/' + foreign.id, 404)
  await api.request('foreign_delete', 'subjects/' + foreign.id + '?confirm=true', 404, 'DELETE')
  const unchanged = await other.request<Subject>('foreign_unchanged', 'subjects/' + foreign.id, 200)
  check(JSON.stringify(unchanged) === JSON.stringify(foreign), 'foreign intact')
  for (const id of [...api.owned]) await remove(id)
  const empty = await api.request<SubjectList>('empty_after_deletes', 'subjects?status=all', 200)
  check(empty.items.length === 0, 'all synthetic subjects removed')
  stage = 'cookies/storage/refresh'
  const cookies = await context.cookies()
  for (const name of ['cognova_refresh', 'cognova_csrf']) {
    const cookie = cookies.find(c => c.name === name)
    check(cookie?.secure && cookie.sameSite === 'Lax' && cookie.domain === 'cognova-frontend.netlify.app', 'secure host-only cookies')
    check(cookie.httpOnly === (name === 'cognova_refresh'), 'HttpOnly')
    check(cookie.path === (name === 'cognova_refresh' ? '/api/v1/auth' : '/'), 'cookie path')
  }
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), readableCookies: document.cookie.split(';').map(c => c.trim().split('=')[0]) }))
  check(storage.local.every(key => key === 'cognova.theme') && !storage.session.length && !storage.readableCookies.includes('cognova_refresh'), 'no credentials in JS storage')
  await page.reload(); await expect(page.getByText('Un espacio para tus materias', { exact: true })).toBeVisible()
  await api.cleanup(); apiClosed = true
  await page.reload(); await expect(page).toHaveURL(/\/login$/)
  await Promise.all(responseTasks)
  check(apiResponses.length > 0 && apiResponses.every(r => r.noStore), 'browser API no-store')
  check(pageErrors === 0, 'uncaught browser errors')
  console.log(JSON.stringify({ result: 'BROWSER PASS', userId: api.userId, otherUserId: other.userId, pageErrors, cspViolations, responses: apiResponses.length }))
} catch { await page.screenshot({ path: '.local/subjects-failure.png', fullPage: true }).catch(() => undefined); console.error('Browser smoke stopped at: ' + stage); process.exitCode = 1 }
finally {
  try { if (!apiClosed && api.userId) await api.cleanup(); if (other.userId) await other.cleanup() }
  catch { console.error('Synthetic cleanup incomplete'); process.exitCode = 1 }
  await writeFile('.local/subjects-browser-smoke.json', JSON.stringify({ date: new Date().toISOString(), passed: !process.exitCode, stage, userId: api.userId, otherUserId: other.userId, pageErrors, cspViolations, apiResponses, checks: api.evidence, otherChecks: other.evidence }, null, 2))
  await browser.close()
}
