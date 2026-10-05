import type { AuthUser } from '../types/auth'

export const user: AuthUser = {
  id: 1, name: 'Sara', email: 'sara@example.com', degree_program: 'Ingeniería', semester: 4, academic_goal: 'Mejorar mi constancia',
}

// Unsigned fixture, only used by tests with intercepted HTTP responses.
export function makeToken(expiresAt = Date.now() + 3_600_000): string {
  return `${btoa('{"alg":"HS256"}').replace(/=/g, '')}.${btoa(JSON.stringify({ sub: '1', email: user.email, exp: Math.floor(expiresAt / 1000) })).replace(/=/g, '')}.test-signature`
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
