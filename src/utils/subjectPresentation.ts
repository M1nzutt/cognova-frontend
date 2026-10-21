import { ApiError } from '../api/ApiError'
export const difficultyLabels = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' }
export const colorLabels: Record<string, string> = { blue: 'Azul', violet: 'Violeta', pink: 'Rosa', rose: 'Rosado', orange: 'Naranja', amber: 'Ámbar', green: 'Verde', teal: 'Turquesa', cyan: 'Cian', slate: 'Gris' }
export function subjectError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'SUBJECT_NAME_CONFLICT') return 'Ya existe una materia con ese nombre, incluso entre las archivadas. Elige otro nombre.'
    if (error.code === 'SUBJECT_ACTIVE_LIMIT') return 'Ya tienes cinco materias activas. Archiva una antes de crear otra.'
    if (error.code === 'SUBJECT_REACTIVATION_LIMIT') return 'No hay cupo para reactivar esta materia. Archiva otra primero.'
    if (error.status === 404) return 'No encontramos esta materia. Puede haber sido eliminada.'
    if (error.status === 409) return 'No se pudo completar el cambio por un conflicto. Vuelve a consultar la materia antes de intentarlo de nuevo.'
    return error.message
  }
  return 'No pudimos completar la solicitud. Inténtalo de nuevo.'
}
