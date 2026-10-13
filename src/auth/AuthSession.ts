import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import { AuthService } from '../services/AuthService'
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types/auth'
import { getTokenExpiry } from '../utils/jwt'
import { readCsrfCookie } from '../utils/csrf'
import { clearLegacyAuth } from './clearLegacyAuth'
import { withCookieLock } from './cookieLock'
import { onboardingPath } from '../utils/onboardingPath'
import type { AcademicProfileRequest } from '../types/onboarding'
import { readAuthUser } from '../utils/readAuthUser'

interface AuthSnapshot {
  status: 'loading' | 'anonymous' | 'authenticated'
  user: AuthUser | null
  message: string | null
  destination: ReturnType<typeof onboardingPath>
  loggingOut: boolean
  logoutFailed: boolean
}
const expiredMessage = 'Tu sesión expiró. Inicia sesión nuevamente.'

export class AuthSession {
  readonly api: ApiClient
  private readonly service: AuthService
  private token: string | null = null
  private snapshot: AuthSnapshot = { status: 'loading', user: null, message: null, destination: '/dashboard', loggingOut: false, logoutFailed: false }
  private listeners = new Set<() => void>()
  private revision = 0
  private refreshPending: Promise<void> | null = null
  private restorePending: Promise<void> | null = null
  private logoutPending: Promise<void> | null = null

  constructor(baseUrl: string) {
    this.api = new ApiClient(baseUrl, () => this.token, (token) => {
      if (token === this.token) this.invalidate(expiredMessage)
    }, () => this.refresh(), () => this.revision)
    this.service = new AuthService(this.api)
  }
  getSnapshot = (): AuthSnapshot => this.snapshot
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  private update(change: Partial<AuthSnapshot>): void {
    if (change.user) change.destination = onboardingPath(change.user.onboarding.next_step)
    this.snapshot = { ...this.snapshot, ...change }
    this.listeners.forEach((listener) => listener())
  }
  start(): () => void {
    void this.restore()
    // Do not cancel a rotating refresh on StrictMode's effect replay.
    return () => undefined
  }
  restore = (): Promise<void> => {
    if (this.restorePending) return this.restorePending
    this.restorePending = this.restoreSession().finally(() => { this.restorePending = null })
    return this.restorePending
  }
  private async restoreSession(): Promise<void> {
    if (this.snapshot.loggingOut || this.snapshot.logoutFailed) return
    const revision = ++this.revision
    this.token = null
    this.update({ status: 'loading', user: null, message: null })
    try {
      clearLegacyAuth()
      if (!readCsrfCookie()) {
        this.update({ status: 'anonymous' })
        return
      }
      await this.refresh()
      if (revision !== this.revision) return
      this.update({ status: 'authenticated' })
    } catch (error) {
      if (revision === this.revision) this.invalidate(error instanceof ApiError ? error.message : 'No pudimos preparar una sesión segura. Revisa los permisos del navegador.')
    }
  }
  private refresh(): Promise<void> {
    if (this.logoutPending || this.snapshot.loggingOut) return Promise.reject(new ApiError(expiredMessage, 401))
    if (this.refreshPending) return this.refreshPending
    const revision = this.revision
    this.refreshPending = withCookieLock(async () => {
      if (revision !== this.revision) throw new ApiError(expiredMessage, 401)
      const response = await this.service.refresh()
      if (revision !== this.revision) throw new ApiError(expiredMessage, 401)
      this.acceptToken(response.access_token)
      // A refresh can observe onboarding completed in another tab. This read
      // must never refresh recursively if the newly issued token is rejected.
      const user = await this.service.me(undefined, false)
      if (revision !== this.revision) throw new ApiError(expiredMessage, 401)
      this.update({ user })
    }).catch((error: unknown) => {
      if (revision === this.revision) this.invalidate(error instanceof ApiError && error.status === 401 ? expiredMessage : 'No pudimos renovar tu sesión. Inicia sesión nuevamente.')
      throw error
    }).finally(() => { this.refreshPending = null })
    return this.refreshPending
  }
  login(details: LoginRequest, signal: AbortSignal): Promise<void> {
    return this.authenticate(() => this.service.login(details), signal)
  }
  register(details: RegisterRequest, signal: AbortSignal): Promise<void> {
    return this.authenticate(() => this.service.register(details), signal)
  }
  async reloadProfile(signal?: AbortSignal): Promise<void> {
    if (this.snapshot.status !== 'authenticated') throw new ApiError(expiredMessage, 401)
    const revision = this.revision
    const user = await this.service.me(signal)
    if (revision === this.revision) this.update({ user })
  }
  async saveAcademicProfile(details: AcademicProfileRequest, signal?: AbortSignal): Promise<void> {
    const revision = this.revision
    const user = readAuthUser(await this.api.request('/onboarding/academic-profile', { method: 'PUT', body: details, signal }))
    if (revision === this.revision) this.update({ user })
  }
  private async authenticate(request: () => Promise<AuthResponse>, signal: AbortSignal): Promise<void> {
    if (this.snapshot.loggingOut || this.snapshot.logoutFailed) throw new ApiError('Completa el cierre de sesión antes de volver a ingresar.')
    const revision = ++this.revision
    const response = await withCookieLock(request)
    if (revision !== this.revision) throw new DOMException('Request cancelled', 'AbortError')
    // Reconcile cookie mutations even if the initiating form unmounts.
    this.acceptToken(response.access_token)
    this.update({ status: 'authenticated', user: response.user, message: null })
    signal.throwIfAborted()
  }
  private acceptToken(token: string): void {
    const expiry = getTokenExpiry(token)
    if (!expiry || expiry <= Date.now()) throw new ApiError('El servidor devolvió una sesión no válida o expirada.', 0, 'INVALID_RESPONSE')
    this.token = token
  }
  logout = (): Promise<void> => {
    if (this.logoutPending) return this.logoutPending
    this.invalidate(null)
    this.update({ loggingOut: true, logoutFailed: false })
    this.logoutPending = withCookieLock(() => this.service.logout()).then(() => {
      this.update({ message: null, logoutFailed: false })
    }).catch(() => {
      this.update({ logoutFailed: true, message: 'No pudimos confirmar el cierre de sesión en el servidor. Reintenta para revocar la sesión.' })
    }).finally(() => {
      this.logoutPending = null
      this.update({ loggingOut: false })
    })
    return this.logoutPending
  }
  private invalidate(message: string | null): void {
    ++this.revision
    this.token = null
    this.update({ status: 'anonymous', user: null, message })
  }
}
