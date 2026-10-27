import { describe, expect, it } from 'vitest'
import { addDays, dayKey, groupCalendar, movePeriod, parseDay, period } from './calendarDates'
import { calendarItem } from '../test/calendarFixtures'
describe('Calendar local dates', () => {
  it('covers complete Monday weeks for month and week', () => {
    const month = period(new Date(2030,0,15), 'month'), week = period(new Date(2030,0,15), 'week')
    expect(dayKey(month.start)).toBe('2029-12-31'); expect(dayKey(month.end)).toBe('2030-02-04'); expect(month.days).toHaveLength(35)
    expect(week.days).toHaveLength(7); expect(week.start.getDay()).toBe(1)
  })
  it('navigates month and year boundaries without skipping February', () => {
    expect(dayKey(movePeriod(new Date(2030,0,31), 'month', 1))).toBe('2030-02-01')
    expect(dayKey(movePeriod(new Date(2030,11,31), 'month', 1))).toBe('2031-01-01')
    expect(dayKey(movePeriod(new Date(2030,0,1), 'month', -1))).toBe('2029-12-01')
    expect(dayKey(movePeriod(new Date(2030,11,31), 'week', 1))).toBe('2031-01-07')
  })
  it('supports leap years and six-week months', () => {
    expect(dayKey(addDays(new Date(2032,1,28),1))).toBe('2032-02-29')
    expect(period(new Date(2026,2,1),'month').days).toHaveLength(42)
  })
  it('uses local midnights through offset changes', () => {
    const range = period(new Date(2026,2,8),'week')
    expect(range.days.every(d => d.getHours() === 0)).toBe(true)
    expect(new Date(range.query.deadline_to).getHours()).toBe(0)
  })
  it('rejects invalid and unsupported date parameters', () => {
    const today = new Date(2030,0,15)
    for (const raw of ['2030-02-30', '0001-01-01','2101-01-01','secret',null]) expect(dayKey(parseDay(raw,today))).toBe('2030-01-15')
    expect(dayKey(parseDay('2032-02-29'))).toBe('2032-02-29')
  })
  it('groups by local date rather than UTC date', () => {
    const local = new Date(2030,0,15,23,59)
    const item = { ...calendarItem, deadline: local.toISOString() }
    expect(groupCalendar([item]).get('2030-01-15')).toEqual([item])
  })
})
