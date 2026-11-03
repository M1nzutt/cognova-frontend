export function validQueryParameter(key: string, value: number | string) {
  if (!/^[a-z_]+$/.test(key)) return false
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 1
  if (key === 'type' || key === 'after_type') return ['activity', 'study_session'].includes(value)
  if (key === 'status') return ['active', 'archived', 'all', 'pending', 'in_progress', 'completed', 'partial', 'postponed', 'cancelled'].includes(value)
  if (key === 'execution_state') return ['planned', 'running', 'paused', 'finished'].includes(value)
  if (key === 'priority') return ['low', 'medium', 'high', 'urgent'].includes(value)
  if (key === 'confirm') return value === 'true'
  return ['deadline', 'deadline_from', 'deadline_to', 'after_deadline', 'planned_start_from', 'planned_start_to', 'after_planned_start_at'].includes(key)
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value))
}
