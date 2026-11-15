import type { CalendarView } from '../types/calendar'
import { dayKey, movePeriod, parseDay, periodLabel } from '../utils/calendarDates'
import styles from './CalendarViews.module.css'

interface Props { date: Date; view: CalendarView; onDate: (date: Date) => void; onView: (view: CalendarView) => void }

export function CalendarToolbar({ date, view, onDate, onView }: Props) {
  const previous = movePeriod(date, view, -1), next = movePeriod(date, view, 1)
  return <section className={styles.toolbar} aria-label="Controles del calendario">
    <div className={styles.toolbarTop}>
      <div className={styles.periodTitle}>
        <h2 id="calendar-period" aria-live="polite">{periodLabel(date, view)}</h2>
        <span>{view === 'month' ? 'Vista mensual' : 'Vista semanal'} · Zona local</span>
      </div>
      <div className={styles.toolbarControls}>
        <div className={styles.periodControls} role="group" aria-label="Periodo del calendario">
          <button className={styles.iconButton} type="button" disabled={previous.getFullYear() < 1900} onClick={() => onDate(previous)} aria-label="Periodo anterior" title="Periodo anterior">‹</button>
          <button className={styles.todayButton} type="button" onClick={() => onDate(new Date())}>Hoy</button>
          <button className={styles.iconButton} type="button" disabled={next.getFullYear() > 2100} onClick={() => onDate(next)} aria-label="Periodo siguiente" title="Periodo siguiente">›</button>
        </div>
        <label className={styles.dateControl}><span className={styles.dateIcon} aria-hidden="true">⌑</span><span className="visually-hidden">Ir a fecha</span>
          <input aria-label="Ir a fecha" type="date" className={styles.dateInput} min="1900-01-01" max="2100-12-31" value={dayKey(date)} onChange={event => { if (event.target.value) onDate(parseDay(event.target.value, date)) }} />
        </label>
        <div className={styles.viewSwitch} role="group" aria-label="Vista del calendario">
          <button type="button" aria-pressed={view === 'month'} onClick={() => onView('month')}>Mes</button>
          <button type="button" aria-pressed={view === 'week'} onClick={() => onView('week')}>Semana</button>
        </div>
      </div>
    </div>
  </section>
}
