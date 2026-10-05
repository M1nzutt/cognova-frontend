export interface AuthUser {
  id: number
  name: string
  email: string
  degree_program: string
  semester: number
  academic_goal: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  name: string
  degree_program: string
  semester: number
  academic_goal: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
}

export interface AuthResponse extends TokenResponse {
  user: AuthUser
}
