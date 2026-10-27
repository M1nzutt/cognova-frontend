import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCalendarQuery } from '../hooks/useCalendarQuery'
import { useCalendarData } from '../hooks/useCalendarData'
import { useActivityServices } from '../hooks/useActivityServices'
import { useActivityResource } from '../hooks/useActivityResource'
import { CalendarService } from '../services/CalendarService'
import { CalendarToolbar } from '../components/CalendarToolbar'
import { CalendarFilters } from '../components/CalendarFilters'
import { CalendarMonth } from '../components/CalendarMonth'
import { CalendarWeek } from '../components/CalendarWeek'
import { CalendarEmpty, CalendarError, CalendarLoading } from '../components/CalendarFeedback'
import { groupCalendar, period } from '../utils/calendarDates'
import { localZone } from '../utils/activityPresentation'
import type { CalendarQuery, CalendarView } from '../types/calendar'
import type { Subject } from '../types/subject'
import styles from './CalendarPage.module.css'

export function CalendarPage() {
  const { session } = useAuth(), q = useCalendarQuery()
  const service = useMemo(() => new CalendarService(session.api), [session])
  const { loadSubjects } = useActivityServices(), subjects = useActivityResource(loadSubjects)
  const range = period(q.date, q.view), query = { ...range.query, ...q.filters }
  return <section className={styles.page} aria-labelledby="calendar-title">
    <p className="eyebrow">TU RECORRIDO ACADÉMICO</p><h1 id="calendar-title">Calendario</h1>
    <p>Tus actividades, en perspectiva. Consulta y edita cada una desde su detalle.</p>
    <p className={styles.zone}>Fechas y horas en {localZone()}. Semanas de lunes a domingo.</p>
    <Link to="/app/activities" className="button">Ir a Actividades</Link>
    <CalendarToolbar date={q.date} view={q.view} onDate={q.onDate} onView={q.onView} />
    {subjects.loading && <p role="status">Cargando materias…</p>}
    {subjects.error && <div role="alert"><p>No pudimos cargar tus materias.</p><button className="button" onClick={subjects.retry}>Reintentar materias</button></div>}
    <CalendarFilters value={q.filters} subjects={subjects.data ?? []} onChange={q.onFilters} />
    <CalendarResults key={JSON.stringify(query)} service={service} query={query} date={q.date} view={q.view} subjects={subjects.data ?? []} filtered={Object.keys(q.filters).length > 0} />
  </section>
}
function CalendarResults({ service, query, date, view, subjects, filtered }: { service: CalendarService; query: CalendarQuery; date: Date; view: CalendarView; subjects: Subject[]; filtered: boolean }) {
  const { items, error, retry } = useCalendarData(service, query)
  if (error) return <CalendarError message={error} onRetry={retry} />
  if (!items) return <CalendarLoading />
  const props = { days:period(date,view).days, date, subjects, groups:groupCalendar(items) }
  return <>{items.length ? <p role="status">{items.length} actividades en el periodo.</p> : <CalendarEmpty filtered={filtered} />}
    {view === 'month' ? <CalendarMonth {...props} /> : <CalendarWeek {...props} />}</>
}
