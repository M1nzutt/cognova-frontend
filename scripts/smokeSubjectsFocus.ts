import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { SubjectSmokeApi, check, production } from './SubjectSmokeApi.ts'
import type { SubjectList } from '../src/types/subject.ts'
check(process.env.SMOKE_ALLOW_PRODUCTION_WRITE === '1', 'Explicit production opt-in required')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const api = new SubjectSmokeApi(context)
const page = await context.newPage(); page.setDefaultTimeout(15000)
let stage = 'setup', passed = false, deleteRequests = 0
const checks: string[] = []
page.on('request', request => { if (request.method() === 'DELETE' && request.url().includes('/subjects/')) deleteRequests++ })
try {
  await mkdir('.local', { recursive: true })
  await api.bootstrap()
  const subject = await api.create('Prueba foco DELETE')
  await page.goto(production + '/app/subjects/' + subject.id)
  const trigger = page.getByRole('button', { name: 'Eliminar materia', exact: true })
  const dialog = page.getByRole('dialog')
  stage = 'keyboard Escape cancellation'
  await trigger.focus(); await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused()
  check(deleteRequests === 0, 'Cancel must not send DELETE'); checks.push('Escape restores trigger; no DELETE')
  stage = 'keyboard Cancel button'
  await page.keyboard.press('Enter'); await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused()
  check(deleteRequests === 0, 'Cancel button must not send DELETE'); checks.push('Enter on Cancel restores trigger; no DELETE')
  stage = 'confirmed DELETE'
  await page.keyboard.press('Enter'); await expect(dialog).toBeVisible()
  const permanent = dialog.getByRole('button', { name: 'Eliminar definitivamente' })
  await expect(permanent).toBeDisabled()
  await dialog.getByRole('checkbox').focus(); await page.keyboard.press('Space')
  await expect(permanent).toBeEnabled()
  await page.screenshot({ path: '.local/subjects-focus-confirmation.png', fullPage: true })
  const responsePromise = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().includes('/subjects/' + subject.id))
  await permanent.focus(); await page.keyboard.press('Enter')
  const response = await responsePromise
  check(response.status() === 204 && response.headers()['cache-control']?.includes('no-store'), 'DELETE204/no-store')
  await expect(page.getByText('Materia eliminada.', { exact: true })).toBeVisible()
  await api.request('get_after_delete', 'subjects/' + subject.id, 404)
  await api.request('second_delete', 'subjects/' + subject.id + '?confirm=true', 404, 'DELETE')
  const list = await api.request<SubjectList>('list_after_delete', 'subjects?status=all', 200)
  check(!list.items.some(item => item.id === subject.id), 'absent from list')
  api.owned.delete(subject.id)
  check(Number(deleteRequests) === 1, 'exactly one UI DELETE')
  checks.push('DELETE204/no-store; GET404; repeat DELETE404; absent from list')
  passed = true
} catch {
  await page.screenshot({ path: '.local/subjects-focus-failure.png', fullPage: true }).catch(() => undefined)
  console.error('Focus smoke stopped at: ' + stage); process.exitCode = 1
} finally {
  try { if (api.userId) await api.cleanup() } catch { passed = false; process.exitCode = 1; console.error('Cleanup incomplete') }
  const evidence = { date: new Date().toISOString(), passed, stage, userId: api.userId, deleteRequests, checks, api: api.evidence }
  await writeFile('.local/subjects-focus-smoke.json', JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify({ passed, userId: api.userId, checks }))
  await browser.close()
}
