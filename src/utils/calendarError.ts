import { ApiError } from '../api/ApiError'
export function calendarError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.'
    if (error.status === 403) return 'Completa tu perfil académico y cuestionario para consultar el calendario.'
    if (error.status === 422) return 'No pudimos consultar este periodo. Selecciona otra fecha o limpia los filtros.'
    if (error.status === 503) return 'El calendario no está disponible temporalmente. Inténtalo más tarde.'
  }
  return 'No pudimos cargar el calendario. Comprueba tu conexión e inténtalo de nuevo.'
}
