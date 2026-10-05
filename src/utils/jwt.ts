// This only inspects expiry for UX. The backend verifies the JWT signature.
export function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload: unknown = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')))
    if (!payload || typeof payload !== 'object' || !('exp' in payload) || typeof payload.exp !== 'number') return null
    const expiry = payload.exp * 1000
    return Number.isFinite(expiry) && expiry > 0 ? expiry : null
  } catch {
    return null
  }
}
