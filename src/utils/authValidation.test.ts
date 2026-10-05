import { describe, expect, it } from 'vitest'
import { validateLogin, validateRegistration } from './authValidation'
import { user } from '../test/authFixtures'

const details = { name: user.name, email: user.email, password: 'Example123!', degree_program: user.degree_program, semester: 4, academic_goal: user.academic_goal }

describe('form validation', () => {
  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid semester %s', (semester) => {
    expect(validateRegistration({ ...details, semester })).toBe('El semestre debe ser un número entero positivo.')
  })
  it('validates email and required password without imposing registration rules on login', () => {
    expect(validateLogin({ email: 'bad', password: 'password' })).toBeTruthy()
    expect(validateLogin({ email: user.email, password: '' })).toBeTruthy()
    expect(validateLogin({ email: user.email, password: 'short' })).toBeNull()
    expect(validateRegistration({ ...details, password: 'short' })).toBeTruthy()
    expect(validateRegistration({ ...details, password: 'a'.repeat(256) })).toBeNull()
  })
})
