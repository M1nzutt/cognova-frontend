import type { AcademicProfileRequest } from '../types/onboarding'

export function validateAcademicProfile(profile: AcademicProfileRequest): string | null {
  if (!profile.degree_program.trim()) return 'Escribe tu carrera.'
  if (!Number.isInteger(profile.semester) || profile.semester < 1 || profile.semester > 2147483647) {
    return 'El semestre debe ser un entero entre 1 y 2147483647.'
  }
  return null
}
