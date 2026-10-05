import { ApiError } from './ApiError'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  authenticated?: boolean
  signal?: AbortSignal
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: () => string | null,
    private readonly onUnauthorized: (token: string) => void,
  ) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    // Callers supply contract paths, never user-provided or absolute URLs.
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('..')) {
      throw new ApiError('La ruta de la API no es válida.', 0, 'INVALID_PATH')
    }
    const token = options.authenticated === false ? null : this.getToken()
    const headers = new Headers({ Accept: 'application/json' })
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (options.body !== undefined) headers.set('Content-Type', 'application/json')

    let response: Response
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
        credentials: 'omit',
        cache: 'no-store',
      })
    } catch (error) {
      if (options.signal?.aborted) throw error
      throw new ApiError('No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.')
    }

    // Invalidate before reading the body: a proxy may return a non-JSON 401.
    if (response.status === 401 && token) this.onUnauthorized(token)
    const data: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined)
    if (!response.ok) {
      const error = data && typeof data === 'object' && 'error' in data ? data.error : undefined
      const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
        ? error.code : 'HTTP_ERROR'
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message : 'No pudimos completar la solicitud. Inténtalo de nuevo.'
      throw new ApiError(message, response.status, code)
    }
    if (data === undefined && response.status !== 204) {
      throw new ApiError('El servidor devolvió una respuesta no válida. Inténtalo de nuevo.', response.status, 'INVALID_RESPONSE')
    }
    return data as T
  }
}
