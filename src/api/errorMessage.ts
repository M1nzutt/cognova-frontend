const messages: Record<string, string> = {
  LEGACY_PROFILE_REMEDIATION_REQUIRED: 'Tu cuenta requiere una revisión de sus datos históricos. Contacta al equipo de Cognova; puedes seguir usando el acceso y cerrar sesión.',
  ONBOARDING_REQUIRED: 'Completa tu perfil y cuestionario para continuar.',
  QUESTIONNAIRE_VERSION_CONFLICT: 'Existe una revisión más reciente. Tus respuestas se conservan para que decidas cómo continuar.',
  QUESTIONNAIRE_ALREADY_EXISTS: 'Ya existe una percepción inicial. Consulta la revisión vigente antes de guardar una nueva.',
  QUESTIONNAIRE_NOT_FOUND: 'Todavía no tienes una percepción inicial guardada.',
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
