import type { CalendarView } from '../types/calendar'
import { dayKey, movePeriod, parseDay, periodLabel } from '../utils/calendarDates'

interface Props { date: Date; view: CalendarView; onDate: (date: Date) => void; onView: (view: CalendarView) => void }
export function CalendarToolbar({ date, view, onDate, onView }: Props) {
  const previous = movePeriod(date, view, -1), next = movePeriod(date, view, 1)
  return <div>
    <h2 id="calendar-period" aria-live="polite">{periodLabel(date, view)}</h2>
    <div className="actions" role="group" aria-label="Periodo del calendario">
      <button className="button" disabled={previous.getFullYear() < 1900} onClick={() => onDate(previous)} aria-label="Periodo anterior">← Anterior</button>
      <button className="button" onClick={() => onDate(new Date())}>Hoy</button>
      <button className="button" disabled={next.getFullYear() > 2100} onClick={() => onDate(next)} aria-label="Periodo siguiente">Siguiente →</button>
      <label>Ir a fecha <input aria-label="Ir a fecha" type="date" className="button" min="1900-01-01" max="2100-12-31" value={dayKey(date)} onChange={e => { if (e.target.value) onDate(parseDay(e.target.value, date)) }} /></label>
      <div className="actions" role="group" aria-label="Vista del calendario">
        <button className="button" aria-pressed={view === 'month'} onClick={() => onView('month')}>Mes</button>
        <button className="button" aria-pressed={view === 'week'} onClick={() => onView('week')}>Semana</button>
      </div>
    </div>
  </div>
}
