import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest, TokenResponse } from '../types/auth'

function isUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false
  const user = value as Record<string, unknown>
  return typeof user.id === 'number' && Number.isInteger(user.id) && user.id > 0
    && ['name', 'email', 'degree_program', 'academic_goal'].every((key) => typeof user[key] === 'string')
    && typeof user.semester === 'number' && Number.isInteger(user.semester) && user.semester > 0
}

function readAuthResponse(value: unknown): AuthResponse {
  if (!value || typeof value !== 'object'
    || !('user' in value) || !isUser(value.user)
    || !('access_token' in value) || typeof value.access_token !== 'string' || !value.access_token
    || !('token_type' in value) || value.token_type !== 'bearer') {
    throw new ApiError('El servidor devolvió una sesión no válida. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE')
  }
  return { user: value.user, access_token: value.access_token, token_type: value.token_type }
}

export class AuthService {
  constructor(private readonly client: ApiClient) {}

  async login(credentials: LoginRequest, signal?: AbortSignal): Promise<AuthResponse> {
    return readAuthResponse(await this.client.request('/auth/login', {
      method: 'POST', body: credentials, authenticated: false, signal,
    }))
  }

  async register(details: RegisterRequest, signal?: AbortSignal): Promise<AuthResponse> {
    return readAuthResponse(await this.client.request('/auth/register', {
      method: 'POST', body: details, authenticated: false, signal,
    }))
  }

  async me(signal?: AbortSignal): Promise<AuthUser> {
    const user = await this.client.request<unknown>('/auth/me', { signal })
    if (!isUser(user)) throw new ApiError('No pudimos leer tu perfil. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE')
    return user
  }

  async refresh(): Promise<TokenResponse> {
    const value = await this.client.request<unknown>('/auth/refresh', { method: 'POST', authenticated: false, csrf: true })
    if (!value || typeof value !== 'object' || !('access_token' in value) || typeof value.access_token !== 'string'
      || !value.access_token || !('token_type' in value) || value.token_type !== 'bearer') {
      throw new ApiError('El servidor devolvió una sesión no válida.', 0, 'INVALID_RESPONSE')
    }
    return { access_token: value.access_token, token_type: 'bearer' }
  }

  async logout(): Promise<void> {
    await this.client.request('/auth/logout', { method: 'POST', authenticated: false, csrf: true })
  }
}
