import type { KeyboardEvent } from 'react'
import type { CalendarItem } from '../types/calendar'
import type { Subject } from '../types/subject'
import { dayKey, fullDay } from '../utils/calendarDates'
import { CalendarEvent } from './CalendarEvent'
import styles from './CalendarViews.module.css'
export interface CalendarViewProps { days: Date[]; groups: ReadonlyMap<string, CalendarItem[]>; subjects: Subject[]; date: Date; onDate?: (date: Date) => void }
export function CalendarDay({ day, items, subjects, date, onDate, outside = false }: { day: Date; items: CalendarItem[]; subjects: Subject[]; date: Date; onDate?: (date: Date) => void; outside?: boolean }) {
  const key = dayKey(day), today = key === dayKey(new Date()), selected = key === dayKey(date)
  const selectByKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    let next: Date | null = null
    if (offsets[event.key] !== undefined) next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + offsets[event.key])
    if (event.key === 'Home') next = new Date(day.getFullYear(), day.getMonth(), day.getDate() - ((day.getDay() + 6) % 7))
    if (event.key === 'End') next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + (6 - ((day.getDay() + 6) % 7)))
    if (!next) return
    event.preventDefault()
    onDate?.(next)
    window.requestAnimationFrame(() => document.getElementById(`calendar-day-${dayKey(next!)}`)?.focus())
  }
  return <section className={styles.day} aria-label={fullDay(day)} data-outside={outside || undefined} data-today={today || undefined} data-selected={selected || undefined}>
    <h3><button id={`calendar-day-${key}`} className={styles.daySelect} type="button" aria-label={`${fullDay(day)}${items.length ? `, ${items.length} ${items.length === 1 ? 'elemento' : 'elementos'}` : ''}`} aria-pressed={selected} tabIndex={selected ? 0 : -1} onKeyDown={selectByKeyboard} onClick={() => onDate?.(day)}>
      <time dateTime={key} aria-current={today ? 'date' : undefined}><span className={styles.weekday}>{new Intl.DateTimeFormat('es', { weekday: 'short' }).format(day)}</span><span className={styles.dayNumber}>{day.getDate()}</span><span className={styles.todayLabel}>{today ? 'Hoy' : ''}</span></time>
      <span className={styles.dayCount} aria-label={`${items.length} ${items.length === 1 ? 'elemento' : 'elementos'}`}>{items.length || ''}</span>
    </button></h3>
    {items.length ? <ul>{items.slice(0, 3).map(item => <li key={item.type + ':' + item.id}><CalendarEvent item={item} subject={subjects.find(s => s.id === item.subject_id)} compact /></li>)}</ul> : <p className={styles.free}>Sin elementos</p>}
    {items.length > 3 && <button type="button" className={styles.moreItems} onClick={() => onDate?.(day)}>+{items.length - 3} más <span className="visually-hidden">el {fullDay(day)}</span></button>}
  </section>
}
