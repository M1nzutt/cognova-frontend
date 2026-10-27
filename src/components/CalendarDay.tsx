import type { CalendarActivity } from '../types/calendar'
import type { Subject } from '../types/subject'
import { dayKey, fullDay } from '../utils/calendarDates'
import { CalendarEvent } from './CalendarEvent'
import styles from './CalendarViews.module.css'
export interface CalendarViewProps { days: Date[]; groups: Map<string, CalendarActivity[]>; subjects: Subject[]; date: Date }
export function CalendarDay({ day, items, subjects, outside = false }: { day: Date; items: CalendarActivity[]; subjects: Subject[]; outside?: boolean }) {
  const key = dayKey(day), today = key === dayKey(new Date())
  return <section className={styles.day} aria-label={fullDay(day)} data-outside={outside || undefined} data-today={today || undefined}>
    <h3><time dateTime={key} aria-current={today ? 'date' : undefined}>{fullDay(day)}{today ? ' · Hoy' : ''}</time></h3>
    {items.length ? <ul>{items.map(item => <li key={item.type + ':' + item.id}><CalendarEvent item={item} subject={subjects.find(s => s.id === item.subject_id)} /></li>)}</ul> : <p className={styles.free}>Sin actividades</p>}
  </section>
}
