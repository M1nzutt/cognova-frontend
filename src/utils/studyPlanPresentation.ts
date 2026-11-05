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
export const sourceLabels: Record<PlanSource, string> = { ai: 'Propuesta', manual: 'Creado por ti' }
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
  return value && typeof value === 'object' && !Array.isArray(value) && 'name' in value && typeof value.name === 'string'
    ? value.name : 'esta propuesta'
}

export function decisionText(decision: PlanDecision): string {
  if (decision.action === 'accepted') return `Aceptaste ${proposalName(decision.proposed_value)}.`
  if (decision.action === 'rejected') return `Rechazaste ${proposalName(decision.proposed_value)}; no se aplicó.`
  if (decision.action === 'regenerated') return 'Pediste una nueva propuesta.'
  const field = decision.field_path?.split(':').at(-1) ?? ''
  const label = fieldLabels[field] ?? 'Plan'
  return `${decision.field_path?.startsWith('undo:') ? 'Deshiciste el cambio en' : 'Editaste'} ${label.toLowerCase()}: de ${displayValue(decision.proposed_value, field)} a ${displayValue(decision.chosen_value, field)}.`
}

export function challengeGoal(challenge: StudyChallenge): string {
  const value = challenge.target_value
  if (challenge.target_type === 'study_minutes') return `Estudiar ${String(value.minutes)} minutos`
  if (challenge.target_type === 'activity_completion') return 'Completar la actividad relacionada'
  if (challenge.target_type === 'session_completion') return 'Finalizar la sesión relacionada'
  if (challenge.target_type === 'subject_mastery') return `${String(value.criterion)} · ${String(value.threshold)} %`
  return typeof value.evidence === 'string' ? value.evidence : 'Cumplir el objetivo descrito'
}

export function planError(reason: unknown): string {
  if (reason instanceof ApiError) {
    if (reason.code === 'STUDY_PLAN_GENERATION_UNAVAILABLE') return 'Esta función todavía no está disponible. Tu plan se conserva sin cambios.'
    if (reason.status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.'
    if (reason.status === 403) return 'Completa tu perfil y cuestionario para continuar.'
    if (reason.status === 404) return 'No encontramos este plan o esta misión.'
    if (reason.status === 409) return 'El plan o la misión cambió. Actualizamos los datos; revísalos antes de volver a intentarlo.'
    if (reason.status === 422) return 'Revisa los datos y las relaciones elegidas antes de guardar.'
    if (reason.status >= 500) return 'El servicio no está disponible. Inténtalo más tarde.'
  }
  return 'No pudimos completar la acción. Revisa tu conexión e inténtalo de nuevo.'
}
