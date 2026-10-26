import type { CalendarActivity, CalendarView } from '../types/calendar'

export const dayKey = (d: Date) => [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
export function parseDay(value: string | null, fallback = new Date()) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate())
  const [year, month, day] = value.split('-').map(Number), date = new Date(year, month-1, day)
  return year >= 1900 && year <= 2100 && dayKey(date) === value ? date : new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate())
}
export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate()+days)
export const monday = (date: Date) => addDays(date, -((date.getDay()+6)%7))
export function period(date: Date, view: CalendarView) {
  const start = view === 'week' ? monday(date) : monday(new Date(date.getFullYear(), date.getMonth(), 1))
  const next = new Date(date.getFullYear(), date.getMonth()+1, 1)
  const end = view === 'week' ? addDays(start, 7) : next.getDay() === 1 ? next : addDays(monday(next), 7)
  const days: Date[] = []
  for (let d = start; d < end; d = addDays(d,1)) days.push(d)
  return { start, end, days, query: { deadline_from: start.toISOString(), deadline_to: end.toISOString() } }
}
export function movePeriod(date: Date, view: CalendarView, delta: number) {
  return view === 'week' ? addDays(date, 7*delta) : new Date(date.getFullYear(), date.getMonth()+delta, 1)
}
export const fullDay = (date: Date) => new Intl.DateTimeFormat('es', { dateStyle: 'full' }).format(date)
export function periodLabel(date: Date, view: CalendarView) {
  if (view === 'month') return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(date)
  const start = monday(date), end = addDays(start, 6)
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).formatRange(start, end)
}
export function groupCalendar(items: CalendarActivity[]) {
  const groups = new Map<string, CalendarActivity[]>()
  for (const item of items) {
    const key = dayKey(new Date(item.deadline))
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return groups
}
