import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from '../api/client'
import { AuthService } from './AuthService'
import { clearLegacyAuth } from '../auth/clearLegacyAuth'
import { getTokenExpiry } from '../utils/jwt'
import { jsonResponse, makeToken, user } from '../test/authFixtures'

describe('authentication contract', () => {
  it('posts exact registration fields and login JSON without a Bearer header', async () => {
    const token = makeToken()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ user, access_token: token, token_type: 'bearer' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    const service = new AuthService(new ApiClient('/api/v1', () => 'old-token', vi.fn()))
    const details = { name: user.name, email: user.email, degree_program: user.degree_program, semester: 4, academic_goal: user.academic_goal, password: 'Example123!' }
    expect(await service.register(details)).toEqual({ user, access_token: token, token_type: 'bearer' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/register')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(details)
    expect(fetchMock.mock.calls[0][1].headers.has('Authorization')).toBe(false)
    fetchMock.mockResolvedValue(jsonResponse({ user, access_token: token, token_type: 'bearer' }))
    await service.login({ email: user.email, password: 'Example123!' })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/login')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ email: user.email, password: 'Example123!' })
  })

  it('restores the user through me with the Bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(user))
    vi.stubGlobal('fetch', fetchMock)
    const service = new AuthService(new ApiClient('/api/v1/', () => 'token', vi.fn()))
    expect(await service.me()).toEqual(user)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/me')
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer token')
  })

  it('distinguishes login 401 from protected 401, including non-JSON errors', async () => {
    const unauthorized = vi.fn()
    const client = new ApiClient('/api/v1', () => 'token', unauthorized)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos.' } }, 401))
    vi.stubGlobal('fetch', fetchMock)
    await expect(new AuthService(client).login({ email: user.email, password: 'wrong' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 })
    expect(unauthorized).not.toHaveBeenCalled()
    fetchMock.mockResolvedValue(new Response('Unauthorized', { status: 401 }))
    await expect(client.request('/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(unauthorized).toHaveBeenCalledWith('token')
  })

  it.each([409, 422, 500])('preserves API errors without expiring a session (%s)', async (status) => {
    const unauthorized = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'TEST_ERROR', message: 'Error del servidor.' } }, status)))
    await expect(new ApiClient('/api/v1', () => 'token', unauthorized).request('/auth/me')).rejects.toMatchObject({ status, code: 'TEST_ERROR' })
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('handles offline and malformed successful responses', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)
    const service = new AuthService(new ApiClient('/api/v1', () => null, vi.fn()))
    await expect(service.me()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    fetchMock.mockResolvedValue(jsonResponse({ user }))
    await expect(service.login({ email: user.email, password: 'password' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('deletes legacy credentials without touching preferences', () => {
    localStorage.setItem('cognova.theme', 'dark')
    localStorage.setItem('cognova.access_token', 'obsolete')
    sessionStorage.setItem('cognova.access_token', 'obsolete')
    clearLegacyAuth()
    expect(localStorage.getItem('cognova.access_token')).toBeNull()
    expect(sessionStorage.getItem('cognova.access_token')).toBeNull()
    expect(localStorage.getItem('cognova.theme')).toBe('dark')
  })

  it('sends cookies and rotated CSRF on refresh/logout without JSON or Bearer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ access_token: makeToken(), token_type: 'bearer' }))
    vi.stubGlobal('fetch', fetchMock)
    const service = new AuthService(new ApiClient('/api/v1', () => 'token', vi.fn()))
    document.cookie = 'cognova_csrf=first; Path=/'
    await service.refresh()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/refresh')
    expect(fetchMock.mock.calls[0][1].credentials).toBe('include')
    expect(fetchMock.mock.calls[0][1].headers.get('X-CSRF-Token')).toBe('first')
    expect(fetchMock.mock.calls[0][1].headers.has('Authorization')).toBe(false)
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined()
    document.cookie = 'cognova_csrf=rotated; Path=/'
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await service.logout()
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/logout')
    expect(fetchMock.mock.calls[1][1].headers.get('X-CSRF-Token')).toBe('rotated')
  })

  it('does not send a cookie mutation without readable CSRF', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const service = new AuthService(new ApiClient('/api/v1', () => null, vi.fn()))
    await expect(service.refresh()).rejects.toMatchObject({ status: 403, code: 'CSRF_VALIDATION_FAILED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reads expiry and rejects malformed or missing claims', () => {
    const expiresAt = 2_000_000_000_000
    expect(getTokenExpiry(makeToken(expiresAt))).toBe(expiresAt)
    expect(getTokenExpiry('bad')).toBeNull()
    expect(getTokenExpiry('e30.e30.signature')).toBeNull()
  })
})
