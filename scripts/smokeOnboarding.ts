// Opt-in HTTP smoke against the existing Netlify proxy. Creates one synthetic account.
// Passwords, tokens and cookie values remain in memory; native errors are never logged.
import { randomBytes } from 'node:crypto'
import type { QuestionnaireCatalog, QuestionnaireAnswers, QuestionnaireResponse, QuestionnaireHistory } from '../src/types/questionnaire.ts'

const base = 'https://cognova-frontend.netlify.app'
const cookies = new Map<string, { value: string; path: string }>()
let operation = 'configuration'
let access = ''
function check(value: unknown): asserts value { if (!value) throw new Error('Smoke assertion failed') }
function cookieHeaders(response: Response) {
  for (const header of response.headers.getSetCookie()) {
    const [pair, ...attributes] = header.split(';').map(s => s.trim())
    const split = pair.indexOf('=')
    const name = pair.slice(0, split)
    if (!['cognova_csrf', 'cognova_refresh'].includes(name)) continue
    const value = pair.slice(split + 1)
    const attrs = new Map(attributes.map(a => {
      const i = a.indexOf('=')
      return i < 0 ? [a.toLowerCase(), ''] : [a.slice(0, i).toLowerCase(), a.slice(i + 1)]
    }))
    const path = name === 'cognova_csrf' ? '/' : '/api/v1/auth'
    check(attrs.get('path') === path)
    if (!value || (attrs.has('max-age') && Number(attrs.get('max-age')) <= 0)) { cookies.delete(name); continue }
    cookies.set(name, { value, path })
    check(attrs.has('secure') && attrs.get('samesite')?.toLowerCase() === 'lax' && !attrs.has('domain'))
    check(attrs.has('httponly') === (name === 'cognova_refresh'))
  }
}
async function api<T>(label: string, path: string, status: number, method = 'GET', body?: unknown, csrf = false): Promise<T> {
  operation = label
  const url = new URL('/api/v1/' + path, base)
  const headers = new Headers({ Accept: 'application/json', Origin: base })
  if (access) headers.set('Authorization', 'Bearer ' + access)
  if (body) headers.set('Content-Type', 'application/json')
  const matching = [...cookies].filter(([, c]) => url.pathname.startsWith(c.path))
  if (matching.length) headers.set('Cookie', matching.map(([n, c]) => n + '=' + c.value).join('; '))
  if (csrf) { check(cookies.has('cognova_csrf')); headers.set('X-CSRF-Token', decodeURIComponent(cookies.get('cognova_csrf')!.value)) }
  const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: 'error', signal: AbortSignal.timeout(25000) })
  cookieHeaders(response)
  check(response.status === status && response.headers.get('cache-control')?.includes('no-store'))
  const cors = response.headers.get('access-control-allow-origin')
  check(cors === null || cors === base)
  console.log(JSON.stringify({ operation: label, status: response.status, noStore: true }))
  return response.status === 204 ? null as T : await response.json() as T
}
interface User { id: number; degree_program: string | null; semester: number | null; onboarding: { next_step: string; status: string } }
interface Auth { access_token: string; user: User }
try {
  check(process.env.SMOKE_ALLOW_PRODUCTION_WRITE === '1')
  await api('ready', 'ready', 200)
  await api('unauthenticated_me', 'auth/me', 401)
  const email = 'fe-' + randomBytes(8).toString('hex') + '@example.com'
  const password = randomBytes(9).toString('base64')
  const registered = await api<Auth>('register_minimal', 'auth/register', 201, 'POST', { name: 'Frontend release smoke', email, password })
  access = registered.access_token
  check(access && registered.user.degree_program === null && registered.user.semester === null && registered.user.onboarding.next_step === 'academic_profile')
  check(cookies.has('cognova_refresh') && cookies.has('cognova_csrf'))
  console.log(JSON.stringify({ syntheticUserId: registered.user.id }))
  await api('registration_logout', 'auth/logout', 204, 'POST', undefined, true)
  check(cookies.size === 0)
  access = ''
  const login = await api<Auth>('login', 'auth/login', 200, 'POST', { email, password })
  access = login.access_token
  check((await api<User>('me', 'auth/me', 200)).id === registered.user.id)
  const profile = await api<User>('academic_profile', 'onboarding/academic-profile', 200, 'PUT', { degree_program: 'Synthetic release validation', semester: 1 })
  check(profile.onboarding.next_step === 'questionnaire')
  const catalog = await api<QuestionnaireCatalog>('catalog', 'questionnaire/catalog', 200)
  check(catalog.questionnaire_version === 1 && catalog.questions.length === 10)
  const answers = Object.fromEntries(catalog.questions.map(q => [q.id, { choices: q.options.filter(o => o.id !== 'other').slice(0, q.max_choices).map(o => o.id), other_text: null }])) as QuestionnaireAnswers
  answers.q1 = { choices: ['other'], other_text: 'Synthetic initial perception' }
  const initial = await api<QuestionnaireResponse>('initial_post', 'questionnaire', 201, 'POST', { questionnaire_version: 1, answers })
  check(initial.revision === 1 && initial.answers.q1.other_text === answers.q1.other_text)
  check((await api<QuestionnaireResponse>('current_get', 'questionnaire', 200)).revision === 1)
  const invalid = structuredClone(answers)
  invalid.q6.choices = catalog.questions.find(q => q.id === 'q6')!.options.filter(o => o.id !== 'other').slice(0, 4).map(o => o.id)
  await api('multi_limit_rejected', 'questionnaire', 422, 'PUT', { questionnaire_version: 1, expected_revision: 1, answers: invalid })
  const noOtherText = structuredClone(answers)
  noOtherText.q1.other_text = ''
  await api('other_text_required', 'questionnaire', 422, 'PUT', { questionnaire_version: 1, expected_revision: 1, answers: noOtherText })
  const updatedAnswers = structuredClone(answers)
  updatedAnswers.q1 = { choices: ['organize_time'], other_text: null }
  const update = { questionnaire_version: 1, expected_revision: 1, answers: updatedAnswers }
  check((await api<QuestionnaireResponse>('edit_put', 'questionnaire', 200, 'PUT', update)).revision === 2)
  const conflict = await api<{ error: { code: string } }>('stale_revision', 'questionnaire', 409, 'PUT', update)
  check(conflict.error.code === 'QUESTIONNAIRE_VERSION_CONFLICT')
  const history = await api<QuestionnaireHistory>('history', 'questionnaire/history', 200)
  check(history.items.length === 2 && history.items[0].revision === 2 && history.items[1].revision === 1)
  check(JSON.stringify(history.items[1].answers) === JSON.stringify(initial.answers))
  check((await api<User>('onboarding_complete', 'auth/me', 200)).onboarding.status === 'complete')
  const beforeRefresh = cookies.get('cognova_refresh')!.value
  const beforeCsrf = cookies.get('cognova_csrf')!.value
  await api('csrf_rejected', 'auth/refresh', 403, 'POST')
  access = ''
  const refreshed = await api<{ access_token: string }>('refresh', 'auth/refresh', 200, 'POST', undefined, true)
  access = refreshed.access_token
  check(access && cookies.get('cognova_refresh')!.value !== beforeRefresh && cookies.get('cognova_csrf')!.value !== beforeCsrf)
  check((await api<User>('restored_me_http', 'auth/me', 200)).onboarding.status === 'complete')
  const sessions = await api<unknown[]>('sessions', 'auth/sessions', 200)
  check(Array.isArray(sessions) && sessions.length === 1)
  await api('logout', 'auth/logout', 204, 'POST', undefined, true)
  check(cookies.size === 0)
  await api('revoked_access', 'auth/me', 401)
  console.log('HTTP onboarding smoke PASS; browser UI validation remains separate.')
} catch {
  console.error('Smoke stopped at: ' + operation)
  process.exitCode = 1
} finally {
  if (cookies.has('cognova_refresh') && cookies.has('cognova_csrf')) {
    try { await api('cleanup_logout', 'auth/logout', 204, 'POST', undefined, true) }
    catch { console.error('Cleanup logout unconfirmed'); process.exitCode = 1 }
  }
}
