export function readCsrfCookie(): string | null {
  const value = document.cookie.split('; ').find((part) => part.startsWith('cognova_csrf='))?.slice('cognova_csrf='.length)
  if (!value) return null
  try { return decodeURIComponent(value) } catch { return null }
}
