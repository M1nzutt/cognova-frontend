import { describe, expect, it, vi } from 'vitest'
import { analyticsTimezone, buildAnalyticsRange, initialRangeDates, rangeDatesForPreset } from './analyticsTime'
describe('Analytics date ranges',()=>{
 it('uses local calendar boundaries for day, Monday-based week and month',()=>{
  const now=new Date(2030,3,17,16)
  expect(initialRangeDates('day',now)).toEqual(['2030-04-17','2030-04-18'])
  expect(initialRangeDates('week',now)).toEqual(['2030-04-15','2030-04-22'])
  expect(initialRangeDates('month',now)).toEqual(['2030-04-01','2030-05-01'])
 })
 it('builds instants and carries the browser IANA timezone explicitly',()=>{
  const timezone=analyticsTimezone()
  const range=buildAnalyticsRange('2030-04-15','2030-04-22',timezone)
  expect(range.error).toBe('')
  expect(range.from).toMatch(/Z$/);expect(range.to).toMatch(/Z$/);expect(range.timezone).toBe(timezone)
 })
 it('rejects reversed, invalid and longer than 366 elapsed day ranges',()=>{
  expect(buildAnalyticsRange('2030-01-03','2030-01-01','UTC').error).toMatch(/posterior/)
  expect(buildAnalyticsRange('2030-02-30','2030-03-01','UTC').error).toMatch(/posterior/)
  expect(buildAnalyticsRange('2030-01-01','2031-01-03','UTC').error).toMatch(/366/)
 })
 it('keeps custom dates while presets derive from the current local calendar',()=>{
  expect(rangeDatesForPreset('custom','2030-01-01','2030-02-01')).toEqual(['2030-01-01','2030-02-01'])
  vi.setSystemTime(new Date(2030,0,1,12))
  expect(rangeDatesForPreset('day','','')).toEqual(['2030-01-01','2030-01-02'])
 })
})
