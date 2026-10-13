import type { OnboardingStatus } from './onboarding'

export interface AuthUser {
  id: number
  name: string
  email: string
  degree_program: string | null
  semester: number | null
  onboarding: OnboardingStatus
  legacy_academic_goal?: { value: string | null; captured_at: string } | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  name: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
}

export interface AuthResponse extends TokenResponse {
  user: AuthUser
}
