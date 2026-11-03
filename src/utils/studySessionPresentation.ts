import { ApiError } from '../api/ApiError'
import type { SessionContext, SessionExecutionState, SessionResult, StudySession } from '../types/studySession'

export const executionStateLabels: Record<SessionExecutionState, string> = {
  planned: 'Planificada', running: 'En curso', paused: 'Pausada', finished: 'Finalizada',
}
export const sessionResultLabels: Record<SessionResult, string> = {
  completed: 'Completada', partial: 'Parcial', postponed: 'Postergada', cancelled: 'Cancelada',
}
export const sessionContextLabels: Record<SessionContext, string> = {
  finished_early: 'Terminé antes', distracted: 'Me distraje', tired: 'Me cansé',
  interrupted: 'Tuve una interrupción', changed_activity: 'Cambié de actividad', other: 'Otro',
}

export function studySessionError(reason: unknown): string {
  const status = reason instanceof ApiError ? reason.status : 0
  if (status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.'
  if (status === 403) return 'Completa tu perfil y cuestionario para continuar.'
  if (status === 404) return 'No encontramos esta sesión o ya no está disponible.'
  if (status === 409) return 'La sesión cambió o ya hay otra en curso. Actualizamos la información; revisa antes de volver a intentarlo.'
  if (status === 422) return 'Revisa los datos de la sesión e inténtalo de nuevo.'
  if (status >= 500) return 'El servicio no está disponible. Inténtalo más tarde.'
  return 'No pudimos completar la acción. Revisa tu conexión e inténtalo de nuevo.'
}

export function effectiveSeconds(session: StudySession, now = Date.now()): number {
  const confirmed = Number(session.actual_duration)
  if (!Number.isFinite(confirmed) || confirmed < 0) return 0
  const open = session.execution_state === 'running' ? session.intervals.at(-1) : undefined
  if (!open || open.ended_at !== null) return Math.floor(confirmed)
  return Math.floor(confirmed + Math.max(0, (now - Date.parse(open.started_at)) / 1000))
}

export function formatDuration(totalSeconds: number): string {
  const value = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(value / 3600), minutes = Math.floor(value % 3600 / 60), seconds = value % 60
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function localDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
