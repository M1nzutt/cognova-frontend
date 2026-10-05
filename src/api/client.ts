import { ApiError } from './ApiError'
import { errorMessage } from './errorMessage'
import { readCsrfCookie } from '../utils/csrf'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  authenticated?: boolean
  csrf?: boolean
  signal?: AbortSignal
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: () => string | null,
    private readonly onUnauthorized: (token: string) => void,
    private readonly refresh: () => Promise<void> = async () => { throw new ApiError('Tu sesión expiró. Inicia sesión nuevamente.', 401) },
  ) {}

  async request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
    if (!/^\/[a-zA-Z0-9/_-]+$/.test(path) || path.startsWith('//')) {
      throw new ApiError('La ruta de la API no es válida.', 0, 'INVALID_PATH')
    }
    const token = options.authenticated === false ? null : this.getToken()
    const headers = new Headers({ Accept: 'application/json' })
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (options.body !== undefined) headers.set('Content-Type', 'application/json')
    if (options.csrf) {
      const csrf = readCsrfCookie()
      if (!csrf) throw new ApiError(errorMessage('CSRF_VALIDATION_FAILED', 403), 403, 'CSRF_VALIDATION_FAILED')
      headers.set('X-CSRF-Token', csrf)
    }
    let response: Response
    const timeout = AbortSignal.timeout(20_000)
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        method: options.method ?? 'GET', headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
        credentials: 'include', cache: 'no-store', redirect: 'error',
      })
    } catch (error) {
      if (options.signal?.aborted) throw error
      throw new ApiError(timeout.aborted ? 'El servidor tardó demasiado en responder. Inténtalo de nuevo.' : 'No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.')
    }
    if (response.status === 401 && token) {
      if (retried) {
        this.onUnauthorized(token)
      } else {
        try {
          if (this.getToken() === token) await this.refresh()
          if (!this.getToken()) throw new ApiError('Tu sesión expiró. Inicia sesión nuevamente.', 401)
        } catch (error) {
          this.onUnauthorized(token)
          throw error
        }
        options.signal?.throwIfAborted()
        return this.request<T>(path, options, true)
      }
    }
    const data: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined)
    if (!response.ok) {
      const error = data && typeof data === 'object' && 'error' in data ? data.error : undefined
      const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : 'HTTP_ERROR'
      throw new ApiError(errorMessage(code, response.status), response.status, code)
    }
    if (data === undefined && response.status !== 204) throw new ApiError('El servidor devolvió una respuesta no válida.', response.status, 'INVALID_RESPONSE')
    return data as T
  }
}
