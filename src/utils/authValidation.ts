import type { LoginRequest, RegisterRequest } from '../types/auth'

export function validateLogin(values: LoginRequest): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Escribe un correo electrónico válido.'
  if (!values.password) return 'Escribe tu contraseña.'
  return null
}

export function validateRegistration(values: RegisterRequest): string | null {
  if (!values.name || !values.degree_program || !values.academic_goal) return 'Completa todos los campos obligatorios.'
  const loginError = validateLogin(values)
  if (loginError) return loginError
  if (values.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!Number.isSafeInteger(values.semester) || values.semester <= 0) return 'El semestre debe ser un número entero positivo.'
  return null
}
