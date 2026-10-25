import { ApiError } from '../api/ApiError'
import type { ActivityStatus } from '../types/activity'
export const statusLabels = { pending: 'Pendiente', in_progress: 'En progreso', completed: 'Completada', postponed: 'Postergada', cancelled: 'Cancelada' }
export const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' }
export const dateLabel = (value: string) => new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
export const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
export function localDate(value: string) {
  const d = new Date(value), pad = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}
export function toInstant(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || localDate(new Date(value).toISOString()) !== value) throw new Error('Selecciona una fecha y hora válidas.')
  return new Date(value).toISOString()
}
export const allowedStatus = (current: ActivityStatus, next: ActivityStatus) => !['completed', 'cancelled'].includes(current) || next === current || next === 'pending'
export function activityError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'No pudimos completar la solicitud. Inténtalo de nuevo.'
  if (error.code === 'ACTIVITY_HAS_DEPENDENCIES') return 'Esta actividad tiene historial o registros relacionados y no puede eliminarse. Puedes cambiar su estado a Cancelada para conservar su recorrido.'
  if (error.code === 'SUBJECT_NOT_FOUND') return 'La materia seleccionada ya no está disponible. Consulta tus materias antes de volver a guardar.'
  if (error.status === 404) return 'No encontramos esta actividad. Puede haber sido eliminada.'
  if (error.code === 'ACTIVITY_TRANSITION_CONFLICT') return 'Primero reabre la actividad como Pendiente para cambiar a otro estado.'
  if (error.status === 409) return 'La actividad cambió mientras trabajabas. Conservamos tu borrador; consulta la versión actual antes de volver a guardar.'
  if (error.status === 422) return 'Revisa el título, la materia, la fecha y los límites del formulario.'
  if (error.status === 503) return 'El servicio no está disponible temporalmente. Conservamos tu borrador; inténtalo más tarde.'
  return error.message
}
