import { ApiError } from '../api/ApiError'
export const difficultyLabels = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' }
export const colorLabels: Record<string, string> = { blue: 'Azul', violet: 'Violeta', pink: 'Rosa', rose: 'Rosado', orange: 'Naranja', amber: 'Ámbar', green: 'Verde', teal: 'Turquesa', cyan: 'Cian', slate: 'Gris' }
export function subjectError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'No encontramos esta materia. Puede haber sido eliminada.'
    if (error.status === 409) return 'No se pudo guardar el cambio: revisa si ya existe ese nombre o si tienes cinco materias activas. Las archivadas también conservan su nombre.'
    return error.message
  }
  return 'No pudimos completar la solicitud. Inténtalo de nuevo.'
}
