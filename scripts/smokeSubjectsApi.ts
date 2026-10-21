import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { SubjectSmokeApi, check } from './SubjectSmokeApi.ts'
import type { Subject, SubjectList } from '../src/types/subject.ts'
check(process.env.SMOKE_ALLOW_PRODUCTION_WRITE === '1', 'Explicit production opt-in required')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext()
const api = new SubjectSmokeApi(context)
try {
  await api.bootstrap()
  const first = await api.create('Smoke Materia')
  await api.request('duplicate', 'subjects', 409, 'POST', { name: first.name, difficulty: first.difficulty, color_base: first.color_base, color_shade: first.color_shade })
  const edited = await api.request<Subject>('edit', 'subjects/' + first.id, 200, 'PUT', { name: 'Smoke Editada', difficulty: 'hard', color_base: first.color_base, color_shade: first.color_shade })
  check(edited.name === 'Smoke Editada', 'edit persistence')
  await api.request('archive', 'subjects/' + first.id + '/archive', 200, 'POST')
  for (let i = 0; i < 5; i++) await api.create('Smoke Cupo ' + i)
  await api.request('sixth_active', 'subjects', 409, 'POST', { name: 'Smoke Sexta', difficulty: first.difficulty, color_base: first.color_base, color_shade: first.color_shade })
  await api.request('reactivate_without_capacity', 'subjects/' + first.id + '/reactivate', 409, 'POST')
  const active = await api.request<SubjectList>('active_list', 'subjects', 200)
  check(active.items.length === 5, 'five active')
  await api.request('archive_frees_capacity', 'subjects/' + active.items[0].id + '/archive', 200, 'POST')
  await api.request('reactivate', 'subjects/' + first.id + '/reactivate', 200, 'POST')
  await api.request('delete_requires_confirmation', 'subjects/' + first.id, 422, 'DELETE')
  await api.request('delete', 'subjects/' + first.id + '?confirm=true', 204, 'DELETE')
  await api.request('get_after_delete', 'subjects/' + first.id, 404)
  await api.request('second_delete', 'subjects/' + first.id + '?confirm=true', 404, 'DELETE')
  const list = await api.request<SubjectList>('list_after_delete', 'subjects?status=all', 200)
  check(!list.items.some(item => item.id === first.id), 'deleted absent')
  console.log(JSON.stringify({ result: 'API PASS', userId: api.userId, checks: api.evidence }))
} catch { console.error('Smoke stopped at: ' + api.operation); process.exitCode = 1 }
finally {
  try { if (api.userId) await api.cleanup() } catch { console.error('Cleanup incomplete'); process.exitCode = 1 }
  await mkdir('.local', { recursive: true }); await writeFile('.local/subjects-api-smoke.json', JSON.stringify({ date: new Date().toISOString(), passed: !process.exitCode, userId: api.userId, checks: api.evidence }, null, 2))
  await browser.close()
}
