import { ApiError } from '../api/ApiError'
import type { AuthUser } from '../types/auth'

export function readAuthUser(value: unknown): AuthUser {
  const invalid = () => new ApiError('No pudimos leer tu perfil. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE')
  if (!value || typeof value !== 'object') throw invalid()
  const user = value as Record<string, unknown>
  const state = user.onboarding as Record<string, unknown> | undefined
  const legacy = user.legacy_academic_goal
  if (!Number.isSafeInteger(user.id) || Number(user.id) < 1 || typeof user.name !== 'string' || typeof user.email !== 'string'
    || (user.degree_program !== null && typeof user.degree_program !== 'string')
    || (user.semester !== null && (!Number.isInteger(user.semester) || Number(user.semester) < 1))
    || !state || !['complete', 'incomplete'].includes(String(state.status))
    || typeof state.academic_profile_complete !== 'boolean' || typeof state.questionnaire_complete !== 'boolean'
    || !['academic_profile', 'questionnaire', 'complete'].includes(String(state.next_step))) throw invalid()
  if (legacy != null && (typeof legacy !== 'object' || !('value' in legacy)
    || (legacy.value !== null && typeof legacy.value !== 'string') || !('captured_at' in legacy) || typeof legacy.captured_at !== 'string')) throw invalid()
  return value as AuthUser
}
