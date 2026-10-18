import { describe, expect, it } from 'vitest'
import { validateLogin, validateRegistration } from './authValidation'
import { validateAcademicProfile } from './academicProfileValidation'

const details = { name: 'Sara', email: 'sara@example.com', password: 'Example123!' }
describe('registration contract boundaries', () => {
  it.each(['', '   '])('requires a nonblank name (%s)', name => expect(validateRegistration({ ...details, name })).toBeTruthy())
  it.each([1, 30])('accepts name length %s', n => expect(validateRegistration({ ...details, name: 'a'.repeat(n) })).toBeNull())
  it('rejects name length 31', () => expect(validateRegistration({ ...details, name: 'a'.repeat(31) })).toBeTruthy())
  it.each(['', 'invalid'])('requires valid email (%s)', email => expect(validateRegistration({ ...details, email })).toBeTruthy())
  it('accepts email 50 and rejects 51', () => {
    expect(validateRegistration({ ...details, email: 'a'.repeat(38) + '@example.com' })).toBeNull()
    expect(validateRegistration({ ...details, email: 'a'.repeat(39) + '@example.com' })).toBeTruthy()
  })
  it.each([8, 12])('accepts password length %s', n => expect(validateRegistration({ ...details, password: 'a'.repeat(n) })).toBeNull())
  it.each([0, 7, 13])('rejects password length %s', n => expect(validateRegistration({ ...details, password: 'a'.repeat(n) })).toBeTruthy())
  it('does not trim passwords or block long legacy login credentials', () => {
    expect(validateRegistration({ ...details, password: '        ' })).toBeNull()
    expect(validateLogin({ email: 'a'.repeat(45) + '@example.com', password: 'a'.repeat(256) })).toBeNull()
    expect(validateLogin({ email: details.email, password: 'short' })).toBeNull()
  })
})
describe('academic profile validation', () => {
  it.each([0, -1, 1.5, NaN, Infinity, 2147483648])('rejects semester %s', semester => expect(validateAcademicProfile({ degree_program: 'Ingeniería', semester })).toBeTruthy())
  it.each([1, 2147483647])('accepts semester %s', semester => expect(validateAcademicProfile({ degree_program: 'Ingeniería', semester })).toBeNull())
  it('rejects blank degree and does not invent a length limit', () => {
    expect(validateAcademicProfile({ degree_program: '  ', semester: 1 })).toBeTruthy()
    expect(validateAcademicProfile({ degree_program: 'a'.repeat(1000), semester: 1 })).toBeNull()
  })
})
