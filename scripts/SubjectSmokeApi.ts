import { randomBytes } from 'node:crypto'
import type { BrowserContext } from '@playwright/test'
import type { QuestionnaireCatalog } from '../src/types/questionnaire.ts'
import type { Subject, SubjectCatalog, SubjectList, SubjectWrite } from '../src/types/subject.ts'
export const production = 'https://cognova-frontend.netlify.app'
export function check(value: unknown, label: string): asserts value { if (!value) throw new Error(label) }
// Dedicated synthetic account. Credentials live only in this process and browser context.
export class SubjectSmokeApi {
  private access = ''
  userId = 0
  operation = "configuration"
  readonly owned = new Set<number>()
  readonly evidence: { label: string; status: number; code?: string }[] = []
  private readonly context: BrowserContext
  constructor(context: BrowserContext) { this.context = context }
  async request<T>(label: string, path: string, expected: number, method = 'GET', body?: unknown, csrf = false): Promise<T> {
    this.operation = label
    const headers: Record<string, string> = { Origin: production, Accept: 'application/json' }
    if (this.access) headers.Authorization = 'Bearer ' + this.access
    if (csrf) {
      const cookie = (await this.context.cookies()).find(c => c.name === 'cognova_csrf')
      check(cookie, 'csrf cookie'); headers['X-CSRF-Token'] = decodeURIComponent(cookie.value)
    }
    const response = await this.context.request.fetch(production + '/api/v1/' + path, { method, headers, data: body, timeout: 25000, maxRedirects: 0 })
    check(response.status() === expected, label + ': HTTP ' + response.status())
    check(response.headers()['cache-control']?.includes('no-store'), label + ': no-store')
    const value = expected === 204 ? null : await response.json()
    this.evidence.push({ label, status: response.status(), ...(value?.error?.code ? { code: value.error.code } : {}) })
    return value as T
  }
  async bootstrap() {
    await this.request('ready', 'ready', 200)
    const auth = await this.request<{ access_token: string; user: { id: number } }>('synthetic_register', 'auth/register', 201, 'POST', { name: 'Materias UI smoke', email: 'su-' + randomBytes(8).toString('hex') + '@example.com', password: randomBytes(9).toString('base64') })
    this.access = auth.access_token; this.userId = auth.user.id
    await this.request('academic_profile', 'onboarding/academic-profile', 200, 'PUT', { degree_program: 'Synthetic UI validation', semester: 1 })
    const catalog = await this.request<QuestionnaireCatalog>('questionnaire_catalog', 'questionnaire/catalog', 200)
    const answers = Object.fromEntries(catalog.questions.map(q => [q.id, { choices: [q.options.find(o => o.id !== 'other')!.id], other_text: null }]))
    await this.request('questionnaire', 'questionnaire', 201, 'POST', { questionnaire_version: 1, answers })
    await this.request('csrf_rejected', 'auth/refresh', 403, 'POST')
    const refreshed = await this.request<{ access_token: string }>('csrf_refresh', 'auth/refresh', 200, 'POST', undefined, true)
    this.access = refreshed.access_token
  }
  async create(name: string, status: 'active' | 'archived' = 'active') {
    const catalog = await this.request<SubjectCatalog>('subjects_catalog', 'subjects/catalog', 200)
    const body: SubjectWrite & { status: string } = { name, difficulty: 'medium', color_base: catalog.color_bases[0], color_shade: catalog.color_shades[0], status }
    const item = await this.request<Subject>('create', 'subjects', 201, 'POST', body)
    this.owned.add(item.id); return item
  }
  async cleanup() {
    // Only subjects created by this synthetic test account, never user data.
    for (const id of this.owned) {
      const list = await this.request<SubjectList>('cleanup_list', 'subjects?status=all&limit=100', 200)
      if (list.items.some(item => item.id === id)) await this.request('cleanup_delete', 'subjects/' + id + '?confirm=true', 204, 'DELETE')
    }
    await this.request('logout_csrf_rejected', 'auth/logout', 403, 'POST')
    await this.request('cleanup_logout', 'auth/logout', 204, 'POST', undefined, true)
    await this.request('revoked_access', 'subjects', 401)
  }
}
