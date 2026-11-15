import { dayKey } from '../utils/calendarDates'
import { CalendarDay } from './CalendarDay'
import type { CalendarViewProps } from './CalendarDay'
import styles from './CalendarViews.module.css'
export function CalendarWeek({ days, groups, subjects, date, onDate }: CalendarViewProps) {
  return <div className={styles.week} role="region" aria-label="Vista semanal">
    {days.map(day => <CalendarDay key={dayKey(day)} day={day} date={date} onDate={onDate} items={groups.get(dayKey(day)) ?? []} subjects={subjects} />)}
  </div>
}
