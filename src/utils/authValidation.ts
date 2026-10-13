import type { LoginRequest, RegisterRequest } from '../types/auth'

export function validateLogin(values: LoginRequest): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Escribe un correo electrónico válido.'
  if (!values.password) return 'Escribe tu contraseña.'
  return null
}

export function validateRegistration(values: RegisterRequest): string | null {
  if (!values.name.trim()) return 'Completa todos los campos obligatorios.'
  if ([...values.name.trim()].length > 30) return 'El nombre admite hasta 30 caracteres.'
  const loginError = validateLogin(values)
  if (loginError) return loginError
  if ([...values.email.trim()].length > 50) return 'El correo admite hasta 50 caracteres.'
  if ([...values.password].length < 8 || [...values.password].length > 12) return 'La contraseña debe tener entre 8 y 12 caracteres.'
  return null
}
