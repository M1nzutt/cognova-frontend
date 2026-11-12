export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly retryAfterSeconds: number | null

  constructor(message: string, status = 0, code = 'NETWORK_ERROR', retryAfterSeconds: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}
