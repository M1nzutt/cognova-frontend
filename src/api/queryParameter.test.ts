import { describe, expect, it } from 'vitest'
import { validQueryParameter } from './queryParameter'

describe('API query parameter allowlist',()=>{
 it.each(['activity','study_session'])('accepts Calendar type/cursor value %s',value=>{
  expect(validQueryParameter('type',value)).toBe(true);expect(validQueryParameter('after_type',value)).toBe(true)
 })
 it('accepts Analytics filters and search resource discriminators',()=>{
  expect(validQueryParameter('from','2030-01-01T00:00:00Z')).toBe(true)
  expect(validQueryParameter('to','2030-01-02T00:00:00-05:00')).toBe(true)
  expect(validQueryParameter('timezone','America/Bogota')).toBe(true)
  expect(validQueryParameter('granularity','week')).toBe(true)
  expect(validQueryParameter('category','decision')).toBe(true)
  expect(validQueryParameter('prefix','Física')).toBe(true)
  expect(validQueryParameter('cursor','opaque:token')).toBe(true)
  for(const value of ['subject','activity','study_plan','study_challenge']) expect(validQueryParameter('type',value)).toBe(true)
 })
 it('rejects unsupported Calendar and Analytics values',()=>{
  expect(validQueryParameter('type','personal')).toBe(false)
  expect(validQueryParameter('after_type','decision')).toBe(false)
  expect(validQueryParameter('category','subject')).toBe(false)
  expect(validQueryParameter('timezone','Not/AZone')).toBe(false)
  expect(validQueryParameter('from','2030-01-01')).toBe(false)
  expect(validQueryParameter('prefix','  ')).toBe(false)
  expect(validQueryParameter('cursor','')).toBe(false)
  expect(validQueryParameter('unexpected','study_session')).toBe(false)
 })
})
