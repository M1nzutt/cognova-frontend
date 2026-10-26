export function validQueryParameter(key: string, value: number | string) {
  if (!/^[a-z_]+$/.test(key)) return false
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 1
  if (key === 'status') return ['active', 'archived', 'all', 'pending', 'in_progress', 'completed', 'postponed', 'cancelled'].includes(value)
  if (key === 'priority') return ['low', 'medium', 'high', 'urgent'].includes(value)
  if (key === 'confirm') return value === 'true'
  return ['deadline', 'deadline_from', 'deadline_to', 'after_deadline'].includes(key) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
}
