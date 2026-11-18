export function formatDuration(seconds: string): string {
  const value = Number(seconds)
  if (!Number.isFinite(value) || value < 0) return 'duración no disponible'
  if (value < 60) return `${Math.round(value)} s`
  const minutes = Math.round(value / 60)
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  const duration = hours
    ? `${hours} h${remainder ? ` ${remainder} min` : ''}`
    : `${minutes} min`
  return Math.abs(value - minutes * 60) >= 1 ? `≈ ${duration}` : duration
}
