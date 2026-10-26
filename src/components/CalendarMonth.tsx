import { dayKey } from '../utils/calendarDates'
import { CalendarDay } from './CalendarDay'
import type { CalendarViewProps } from './CalendarDay'
import styles from './CalendarViews.module.css'
export function CalendarMonth({ days, groups, subjects, date }: CalendarViewProps) {
  return <div className={styles.month} role="region" aria-label="Vista mensual">
    {days.map(day => <CalendarDay key={dayKey(day)} day={day} items={groups.get(dayKey(day)) ?? []} subjects={subjects} outside={day.getMonth() !== date.getMonth()} />)}
  </div>
}
