import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/ApiError'
import { planError } from './studyPlanPresentation'

describe('AI error messages', () => {
  it('explains that a timeout has no confirmed result and must be refreshed', () => {
    expect(planError(new ApiError('private', 0, 'TIMEOUT'))).toMatch(/no recibimos confirmación.*Actualiza la vista/i)
  })

  it('uses Retry-After and hides provider details', () => {
    expect(planError(new ApiError('private', 503, 'GEMINI_RATE_LIMIT', 12))).toContain('Espera 12 segundos')
    expect(planError(new ApiError('private', 503, 'STUDY_PLAN_GENERATION_UNAVAILABLE'))).toContain('Tu plan actual se conserva sin cambios')
  })
})
