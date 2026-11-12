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
import type { CalendarItemsQuery, CalendarView } from '../types/calendar'
import type { Subject } from '../types/subject'
import styles from './CalendarPage.module.css'

export function CalendarPage() {
  const { session } = useAuth(), queryState = useCalendarQuery()
  const service = useMemo(() => new CalendarService(session.api), [session])
  const { loadSubjects } = useActivityServices(), subjects = useActivityResource(loadSubjects)
  const range = period(queryState.date, queryState.view), { type, ...filters } = queryState.filters
  const query: CalendarItemsQuery = { ...range.query, ...filters, ...(type && type !== 'all' ? { type } : {}) }
  const filtered = Boolean(queryState.filters.subject_id || queryState.filters.status || queryState.filters.priority || (type && type !== 'all'))
  return <section className={styles.page} aria-labelledby="calendar-title">
    <header className={styles.heading}>
      <div><p className="eyebrow">TU RECORRIDO ACADÉMICO</p><h1 id="calendar-title">Calendario</h1>
        <p>Tus actividades y sesiones, en perspectiva. Abre cada recurso para ver su detalle.</p>
        <p className={styles.zone}>Fechas y horas en {localZone()}. Semanas de lunes a domingo.</p></div>
      <Link to="/app/activities" className="button">Ir a Actividades</Link>
    </header>
    <CalendarToolbar date={queryState.date} view={queryState.view} onDate={queryState.onDate} onView={queryState.onView} />
    {subjects.loading && <p role="status">Cargando materias…</p>}
    {subjects.error && <div role="alert"><p>No pudimos cargar tus materias.</p><button className="button" type="button" onClick={subjects.retry}>Reintentar materias</button></div>}
    <CalendarFilters value={queryState.filters} subjects={subjects.data ?? []} onChange={queryState.onFilters} />
    <CalendarResults key={JSON.stringify(query)} service={service} query={query} date={queryState.date} view={queryState.view} subjects={subjects.data ?? []} filtered={filtered} />
  </section>
}

function CalendarResults({ service, query, date, view, subjects, filtered }: { service: CalendarService; query: CalendarItemsQuery; date: Date; view: CalendarView; subjects: Subject[]; filtered: boolean }) {
  const { items, error, retry } = useCalendarData(service, query)
  if (error) return <CalendarError message={error} onRetry={retry} />
  if (!items) return <CalendarLoading />
  const props = { days: period(date, view).days, date, subjects, groups: groupCalendar(items) }
  return <>{items.length ? <p className={styles.calendarCount} role="status">{items.length} elementos en el periodo.</p> : <CalendarEmpty filtered={filtered} />}
    {view === 'month' ? <CalendarMonth {...props} /> : <CalendarWeek {...props} />}</>
}
