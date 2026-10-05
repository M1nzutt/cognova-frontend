const messages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  EMAIL_ALREADY_REGISTERED: 'El correo ya está registrado.',
  VALIDATION_ERROR: 'Hay datos inválidos en el formulario.',
  INVALID_OR_EXPIRED_TOKEN: 'Tu sesión expiró. Inicia sesión nuevamente.',
  INVALID_REFRESH_TOKEN: 'Tu sesión expiró. Inicia sesión nuevamente.',
  SESSION_REVOKED: 'Tu sesión expiró. Inicia sesión nuevamente.',
  CSRF_VALIDATION_FAILED: 'No pudimos verificar la seguridad de la sesión. Recarga la página e inténtalo de nuevo.',
  TOO_MANY_REQUESTS: 'Has realizado demasiados intentos. Espera un momento antes de volver a intentarlo.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
}

export function errorMessage(code: string, status: number): string {
  if (status >= 500) return 'El servidor no está disponible. Inténtalo más tarde.'
  return messages[code] ?? (status === 403 ? messages.FORBIDDEN : status === 429 ? messages.TOO_MANY_REQUESTS : 'No pudimos completar la solicitud. Inténtalo de nuevo.')
}
