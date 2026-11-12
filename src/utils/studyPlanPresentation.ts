import { ApiError } from '../api/ApiError'
import type { ChallengeStatus, ChallengeTarget, PlanDecision, PlanSource, PlanStatus, StudyChallenge } from '../types/studyPlan'
import { localDateTime } from './studySessionPresentation'

export const planStatusLabels: Record<PlanStatus, string> = {
  draft: 'Borrador', active: 'Activo', completed: 'Completado', abandoned: 'Abandonado',
}
export const challengeStatusLabels: Record<ChallengeStatus, string> = {
  pending: 'Pendiente', in_progress: 'En progreso', completed: 'Completado',
  failed: 'Fallido', cancelled: 'Cancelado',
}
export const sourceLabels: Record<PlanSource, string> = { ai: 'Sugerida por Cognova', manual: 'Creado por ti' }
export const targetLabels: Record<ChallengeTarget, string> = {
  study_minutes: 'Estudiar un tiempo', activity_completion: 'Completar actividad',
  session_completion: 'Completar sesión', subject_mastery: 'Avanzar en una materia',
  custom: 'Objetivo personal',
}
const fieldLabels: Record<string, string> = {
  name: 'Nombre', objective: 'Objetivo', start_at: 'Inicio', end_at: 'Fin',
  subject_ids: 'Materias', activity_ids: 'Actividades', study_session_ids: 'Sesiones',
}

function displayValue(value: unknown, field: string): string {
  if (Array.isArray(value)) return `${value.length} ${fieldLabels[field]?.toLowerCase() ?? 'recursos'}`
  if ((field === 'start_at' || field === 'end_at') && typeof value === 'string' && Number.isFinite(Date.parse(value))) return localDateTime(value)
  if (typeof value === 'string') return value
  return 'Sin valor'
}

function proposalName(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'esta propuesta'
  const row = value as Record<string, unknown>
  if (typeof row.name === 'string') return row.name
  if (row.plan && typeof row.plan === 'object' && !Array.isArray(row.plan) && 'name' in row.plan && typeof row.plan.name === 'string') return row.plan.name
  return 'esta propuesta'
}

export function decisionText(decision: PlanDecision): string {
  if (decision.action === 'accepted') return `Aceptaste ${proposalName(decision.proposed_value)}.`
  if (decision.action === 'rejected') return `Rechazaste ${proposalName(decision.proposed_value)}; no se aplicó.`
  if (decision.action === 'regenerated') return 'Pediste una nueva propuesta.'
  const field = decision.field_path?.split(':').at(-1) ?? ''
  const label = fieldLabels[field] ?? 'Plan'
  return `${decision.field_path?.startsWith('undo:') ? 'Deshiciste el cambio en' : 'Editaste'} ${label.toLowerCase()}: de ${displayValue(decision.proposed_value, field)} a ${displayValue(decision.chosen_value, field)}.`
}

export function decisionValues(decision: PlanDecision): { proposed: string; chosen: string } {
  const field = decision.field_path?.split(':').at(-1) ?? ''
  return {
    proposed: describeValue(decision.proposed_value, field),
    chosen: decision.chosen_value === null ? 'No se eligió un valor.' : describeValue(decision.chosen_value, field),
  }
}

function describeValue(value: unknown, field: string): string {
  if (value === null || value === undefined) return 'No se registró un valor.'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return displayValue(value, field)
  if (Array.isArray(value)) return `${value.length} ${fieldLabels[field]?.toLowerCase() ?? 'elementos'}`
  if (typeof value !== 'object') return 'Valor registrado.'
  const row = value as Record<string, unknown>
  const plan = row.plan && typeof row.plan === 'object' && !Array.isArray(row.plan) ? row.plan as Record<string, unknown> : row
  const parts: string[] = []
  if (typeof plan.name === 'string') parts.push(`Nombre: ${plan.name}`)
  if (typeof plan.objective === 'string') parts.push(`Objetivo: ${plan.objective}`)
  for (const [key, label] of [['subject_ids', 'materias'], ['activity_ids', 'actividades'], ['session_ids', 'sesiones'], ['study_session_ids', 'sesiones'], ['proposed_challenges', 'misiones']] as const) {
    if (Array.isArray(plan[key])) parts.push(`${plan[key].length} ${label}`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'Se guardó el detalle de la propuesta.'
}

export function challengeGoal(challenge: StudyChallenge): string {
  const value = challenge.target_value
  if (challenge.target_type === 'study_minutes') return `Estudiar ${String(value.minutes)} minutos`
  if (challenge.target_type === 'activity_completion') return 'Completar la actividad relacionada'
  if (challenge.target_type === 'session_completion') return 'Finalizar la sesión relacionada'
  if (challenge.target_type === 'subject_mastery') return `${String(value.criterion)} · ${String(value.threshold)} %`
  return typeof value.evidence === 'string' ? value.evidence : 'Cumplir el objetivo descrito'
}

export function aiChallengeContext(challenge: StudyChallenge): { explanation: string | null; evidence: string[]; condition: string | null } {
  if (challenge.source !== 'ai') return { explanation: null, evidence: [], condition: null }
  const criteria = challenge.generation_criteria
  const explanation = typeof criteria.explanation === 'string' && criteria.explanation.trim() ? criteria.explanation : null
  const condition = typeof criteria.measurable_condition === 'string' && criteria.measurable_condition.trim() ? criteria.measurable_condition : null
  const evidence = Array.isArray(criteria.evidence) ? criteria.evidence.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).slice(0, 5) : []
  return { explanation, evidence, condition }
}

export function planError(reason: unknown): string {
  if (reason instanceof ApiError) {
    if (reason.code === 'GEMINI_RATE_LIMIT' || reason.status === 429) {
      const wait = reason.retryAfterSeconds
      const delay = wait === null ? '' : ` Espera ${wait} ${wait === 1 ? 'segundo' : 'segundos'} antes de intentarlo de nuevo.`
      return `La IA está recibiendo muchas solicitudes.${delay} Tus datos guardados no se modifican.`
    }
    if (reason.code === 'STUDY_PLAN_GENERATION_UNAVAILABLE') return 'No pudimos generar una propuesta ahora. Tu plan actual se conserva sin cambios; inténtalo más tarde.'
    if (reason.code === 'TIMEOUT') return 'La solicitud tardó demasiado y no recibimos confirmación. Actualiza la vista para revisar su estado antes de volver a intentarlo.'
    if (reason.status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.'
    if (reason.status === 403) return 'Completa tu perfil y cuestionario para continuar.'
    if (reason.status === 404) return 'No encontramos este plan o esta misión.'
    if (reason.status === 409) return 'El plan o la misión cambió. Actualizamos los datos; revísalos antes de volver a intentarlo.'
    if (reason.status === 422) return 'Revisa los datos y las relaciones elegidas antes de guardar.'
    if (reason.status >= 500) return 'El servicio no está disponible por ahora. Tus datos guardados se conservan; inténtalo más tarde.'
  }
  return 'No pudimos completar la acción. Revisa tu conexión e inténtalo de nuevo.'
}
