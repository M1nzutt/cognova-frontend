import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest, TokenResponse } from '../types/auth'
import { readAuthUser } from '../utils/readAuthUser'

function readAuthResponse(value: unknown): AuthResponse {
  if (!value || typeof value !== 'object'
    || !('user' in value)
    || !('access_token' in value) || typeof value.access_token !== 'string' || !value.access_token
    || !('token_type' in value) || value.token_type !== 'bearer') {
    throw new ApiError('El servidor devolvió una sesión no válida. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE')
  }
  return { user: readAuthUser(value.user), access_token: value.access_token, token_type: value.token_type }
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
      method: 'POST', body: { name: details.name, email: details.email, password: details.password }, authenticated: false, signal,
    }))
  }

  async me(signal?: AbortSignal, retryAuth = true): Promise<AuthUser> {
    return readAuthUser(await this.client.request<unknown>('/auth/me', { signal, retryAuth }))
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
