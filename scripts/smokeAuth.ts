// Real HTTP smoke test. Use a dedicated presentation/test account; no fixtures or mocks.
// Credentials and cookies stay in memory and are never printed or written to disk.
interface Cookie { value: string; path: string }
const cookies = new Map<string, Cookie>()
const base = process.env.SMOKE_BASE_URL
const email = process.env.SMOKE_EMAIL
const password = process.env.SMOKE_PASSWORD

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function collectCookies(response: Response): void {
  for (const header of response.headers.getSetCookie()) {
    const [pair, ...attributes] = header.split(';').map((part) => part.trim())
    const separator = pair.indexOf('=')
    const name = pair.slice(0, separator)
    if (name !== 'cognova_csrf' && name !== 'cognova_refresh') continue
    const value = pair.slice(separator + 1)
    const attrs = new Map(attributes.map((attribute) => {
      const index = attribute.indexOf('=')
      return index < 0 ? [attribute.toLowerCase(), ''] : [attribute.slice(0, index).toLowerCase(), attribute.slice(index + 1)]
    }))
    const expectedPath = name === 'cognova_csrf' ? '/' : '/api/v1/auth'
    check(attrs.get('path') === expectedPath, 'El backend no usa los paths de cookies acordados.')
    if (!value || Number(attrs.get('max-age')) <= 0 || (attrs.has('expires') && Date.parse(attrs.get('expires')!) <= Date.now())) {
      cookies.delete(name)
      continue
    }
    // Save before asserting attributes so a failed smoke can still attempt logout.
    cookies.set(name, { value, path: expectedPath })
    check(attrs.has('secure') && attrs.get('samesite')?.toLowerCase() === 'lax', 'Faltan Secure/SameSite=Lax en una cookie de auth.')
    check(!attrs.has('domain'), 'Las cookies deben ser host-only, sin Domain de Render.')
    check(attrs.has('httponly') === (name === 'cognova_refresh'), 'HttpOnly no coincide con el contrato de cookies.')
  }
}

async function request(path: string, options: { method?: string; body?: unknown; token?: string; csrf?: boolean } = {}) {
  const headers = new Headers({ Accept: 'application/json' })
  const url = new URL(`/api/v1/auth/${path}`, base)
  const matching = [...cookies].filter(([, cookie]) => url.pathname.startsWith(cookie.path))
  if (matching.length) headers.set('Cookie', matching.map(([name, cookie]) => `${name}=${cookie.value}`).join('; '))
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)
  if (options.csrf) {
    const csrf = cookies.get('cognova_csrf')?.value
    check(csrf, 'No se recibió cookie CSRF.')
    headers.set('X-CSRF-Token', decodeURIComponent(csrf))
  }
  if (options.body) headers.set('Content-Type', 'application/json')
  const response = await fetch(url, {
    method: options.method ?? 'GET', headers, redirect: 'error',
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(25_000),
  })
  collectCookies(response)
  check(response.headers.get('cache-control')?.toLowerCase().includes('no-store'), 'Una respuesta auth no incluye Cache-Control: no-store.')
  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null)
  return { status: response.status, data }
}

function readToken(data: unknown): string {
  check(data && typeof data === 'object' && 'access_token' in data && typeof data.access_token === 'string'
    && data.access_token.length > 0 && 'token_type' in data && data.token_type === 'bearer', 'Respuesta de token incompatible con AUTH_CONTRACT.')
  return data.access_token
}

try {
  check(base && email && password, 'Configura SMOKE_BASE_URL, SMOKE_EMAIL y SMOKE_PASSWORD para una cuenta de prueba existente.')
  const origin = new URL(base)
  check(origin.protocol === 'https:' && origin.pathname === '/' && !origin.username && !origin.password && !origin.search && !origin.hash,
    'SMOKE_BASE_URL debe ser el origen HTTPS de Netlify, sin rutas ni credenciales.')
  const login = await request('login', { method: 'POST', body: { email, password } })
  check(login.status === 200, 'Login real falló. Revisa la cuenta, proxy y estado del backend.')
  const access = readToken(login.data)
  check(cookies.has('cognova_csrf') && cookies.has('cognova_refresh'), 'El proxy no entregó ambas cookies de auth.')
  const firstRefresh = cookies.get('cognova_refresh')!.value
  const firstCsrf = cookies.get('cognova_csrf')!.value
  check((await request('me', { token: access })).status === 200, 'No se pudo consultar /auth/me.')
  check((await request('refresh', { method: 'POST' })).status === 403, 'Refresh sin header CSRF no fue rechazado con 403.')
  const renewal = await request('refresh', { method: 'POST', csrf: true })
  check(renewal.status === 200, 'Refresh real falló.')
  const renewed = readToken(renewal.data)
  check(cookies.get('cognova_refresh')?.value !== firstRefresh && cookies.get('cognova_csrf')?.value !== firstCsrf,
    'El backend no rotó las cookies de refresh y CSRF.')
  check((await request('me', { token: renewed })).status === 200, 'El access renovado no permite restaurar el perfil.')
  check((await request('logout', { method: 'POST', csrf: true })).status === 204, 'Logout real no devolvió 204.')
  check(!cookies.has('cognova_refresh') && !cookies.has('cognova_csrf'), 'Logout no eliminó ambas cookies con sus paths correctos.')
  check((await request('me', { token: renewed })).status === 401, 'El backend no revocó el access ligado a la sesión cerrada.')
  process.stdout.write('Smoke HTTP aprobado: login, cookies, me, CSRF, rotación, logout y revocación.\n')
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Falló el smoke HTTP.'}\n`)
  process.exitCode = 1
} finally {
  if (cookies.has('cognova_refresh') && cookies.has('cognova_csrf')) {
    try { await request('logout', { method: 'POST', csrf: true }) }
    catch { process.stderr.write('No se pudo confirmar el logout de limpieza; revisa la sesión de prueba en backend.\n'); process.exitCode = 1 }
  }
}
