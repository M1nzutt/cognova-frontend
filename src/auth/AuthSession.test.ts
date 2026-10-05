import { describe, expect, it, vi } from 'vitest'
import { AuthSession } from './AuthSession'
import { jsonResponse, makeToken, user } from '../test/authFixtures'

const credentials = { email: user.email, password: 'Example123!' }
const signal = () => new AbortController().signal
function csrf() { document.cookie = 'cognova_csrf=csrf; Path=/' }
function unauthorized() { return jsonResponse({ error: { code: 'INVALID_OR_EXPIRED_TOKEN' } }, 401) }

describe('production session', () => {
  it('starts anonymously without reading a legacy token', async () => {
    localStorage.setItem('cognova.access_token', makeToken())
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const session = new AuthSession('/api/v1')
    await session.restore()
    expect(session.getSnapshot().status).toBe('anonymous')
    expect(localStorage.getItem('cognova.access_token')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shares startup refresh then loads me, without persisting credentials', async () => {
    csrf()
    const token = makeToken()
    const fetchMock = vi.fn().mockImplementation(async (url: string) => url.endsWith('/refresh')
      ? jsonResponse({ access_token: token, token_type: 'bearer' }) : jsonResponse(user))
    vi.stubGlobal('fetch', fetchMock)
    const session = new AuthSession('/api/v1')
    await Promise.all([session.restore(), session.restore()])
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual(['/api/v1/auth/refresh', '/api/v1/auth/me'])
    expect(session.getSnapshot()).toMatchObject({ status: 'authenticated', user })
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it.each([401, 403, 429, 500])('ends startup without looping when refresh fails (%s)', async (status) => {
    csrf()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'INVALID_REFRESH_TOKEN' } }, status))
    vi.stubGlobal('fetch', fetchMock)
    const session = new AuthSession('/api/v1')
    await session.restore()
    expect(session.getSnapshot().status).toBe('anonymous')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('coordinates concurrent 401s and retries each request only once', async () => {
    csrf()
    const oldToken = makeToken()
    const newToken = makeToken(Date.now() + 7_200_000)
    const fetchMock = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
      if (url.endsWith('/login')) return jsonResponse({ user, access_token: oldToken, token_type: 'bearer' })
      if (url.endsWith('/refresh')) return jsonResponse({ access_token: newToken, token_type: 'bearer' })
      return new Headers(options.headers).get('Authorization') === `Bearer ${newToken}` ? jsonResponse(user) : unauthorized()
    })
    vi.stubGlobal('fetch', fetchMock)
    const session = new AuthSession('/api/v1')
    await session.login(credentials, signal())
    await Promise.all([session.api.request('/auth/me'), session.api.request('/auth/me'), session.api.request('/auth/me')])
    expect(fetchMock.mock.calls.filter((call) => call[0].endsWith('/refresh'))).toHaveLength(1)
    expect(fetchMock.mock.calls.filter((call) => call[0].endsWith('/me'))).toHaveLength(6)
    expect(session.getSnapshot().status).toBe('authenticated')
  })

  it('stops after the retried request still returns 401', async () => {
    csrf()
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith('/login')) return jsonResponse({ user, access_token: makeToken(), token_type: 'bearer' })
      if (url.endsWith('/refresh')) return jsonResponse({ access_token: makeToken(Date.now() + 7_200_000), token_type: 'bearer' })
      return unauthorized()
    })
    vi.stubGlobal('fetch', fetchMock)
    const session = new AuthSession('/api/v1')
    await session.login(credentials, signal())
    await expect(session.api.request('/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', message: 'Tu sesión expiró. Inicia sesión nuevamente.' })
  })

  it('does not refresh a forbidden response or expose internal error messages', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ user, access_token: makeToken(), token_type: 'bearer' }))
      .mockResolvedValue(jsonResponse({ error: { code: 'FORBIDDEN', message: 'secret stack trace' } }, 403))
    vi.stubGlobal('fetch', fetchMock)
    const session = new AuthSession('/api/v1')
    await session.login(credentials, signal())
    await expect(session.api.request('/auth/me')).rejects.toMatchObject({ status: 403, message: 'No tienes permiso para realizar esta acción.' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(session.getSnapshot().status).toBe('authenticated')
  })

  it('revokes through logout and reports failure with an explicit retry', async () => {
    csrf()
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ user, access_token: makeToken(), token_type: 'bearer' }))
      .mockRejectedValueOnce(new TypeError('offline')).mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const session = new AuthSession('/api/v1')
    await session.login(credentials, signal())
    await session.logout()
    expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', logoutFailed: true })
    await session.logout()
    expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', logoutFailed: false })
    expect(fetchMock.mock.calls[2][0]).toBe('/api/v1/auth/logout')
  })

  it('does not resurrect a session when logout races a refresh', async () => {
    csrf()
    let finishRefresh!: (response: Response) => void
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith('/login')) return jsonResponse({ user, access_token: makeToken(), token_type: 'bearer' })
      if (url.endsWith('/refresh')) return new Promise<Response>((resolve) => { finishRefresh = resolve })
      if (url.endsWith('/logout')) return new Response(null, { status: 204 })
      return unauthorized()
    })
    vi.stubGlobal('fetch', fetchMock)
    const session = new AuthSession('/api/v1')
    await session.login(credentials, signal())
    const pending = session.api.request('/auth/me').catch(() => undefined)
    await vi.waitFor(() => expect(finishRefresh).toBeTypeOf('function'))
    const logout = session.logout()
    finishRefresh(jsonResponse({ access_token: makeToken(), token_type: 'bearer' }))
    await Promise.all([pending, logout])
    expect(session.getSnapshot()).toMatchObject({ status: 'anonymous', user: null, logoutFailed: false })
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/v1/auth/logout')
  })
})
