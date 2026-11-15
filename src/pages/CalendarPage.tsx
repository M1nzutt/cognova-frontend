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
import { CalendarAgenda } from '../components/CalendarAgenda'
import { CalendarMonth } from '../components/CalendarMonth'
import { CalendarWeek } from '../components/CalendarWeek'
import { CalendarEmpty, CalendarError, CalendarLoading } from '../components/CalendarFeedback'
import { groupCalendar, period } from '../utils/calendarDates'
import { localZone } from '../utils/activityPresentation'
import type { CalendarItemsQuery, CalendarView } from '../types/calendar'
import type { Subject } from '../types/subject'
import styles from './CalendarPage.module.css'
import { LoadingStatus } from '../components/LoadingStatus'

export function CalendarPage() {
  const { session } = useAuth(), queryState = useCalendarQuery()
  const service = useMemo(() => new CalendarService(session.api), [session])
  const { loadSubjects } = useActivityServices(), subjects = useActivityResource(loadSubjects)
  const range = period(queryState.date, queryState.view), { type, ...filters } = queryState.filters
  const query: CalendarItemsQuery = { ...range.query, ...filters, ...(type && type !== 'all' ? { type } : {}) }
  const filtered = Boolean(queryState.filters.subject_id || queryState.filters.status || queryState.filters.priority || (type && type !== 'all'))
  return <section className={styles.page} aria-labelledby="calendar-title">
    <header className={styles.intro}>
      <div className={styles.introCopy}><p className="eyebrow">TU SEMANA, EN PERSPECTIVA</p><h1 id="calendar-title">Calendario</h1>
        <p>Actividades y sesiones en una sola mirada. Abre cualquier elemento para continuar donde lo planificaste.</p>
        <p className={styles.zone}>Fechas y horas en {localZone()} · semanas de lunes a domingo</p></div>
      <div className={styles.introAction}><span className={styles.readOnly}>VISTA DE AGENDA</span><Link to="/app/activities" className="button">Ir a Actividades <span aria-hidden="true">→</span></Link></div>
    </header>
    <CalendarToolbar date={queryState.date} view={queryState.view} onDate={queryState.onDate} onView={queryState.onView} />
    {subjects.loading && <LoadingStatus label="Cargando materias…" />}
    {subjects.error && <div role="alert"><p>No pudimos cargar tus materias.</p><button className="button" type="button" onClick={subjects.retry}>Reintentar materias</button></div>}
    <CalendarFilters className={styles.filters} formClassName={styles.filterForm} columnsClassName={styles.filterColumns} value={queryState.filters} subjects={subjects.data ?? []} onChange={queryState.onFilters} />
    <CalendarResults key={JSON.stringify(query)} service={service} query={query} date={queryState.date} view={queryState.view} subjects={subjects.data ?? []} filtered={filtered} onDate={queryState.onDate} />
  </section>
}

function CalendarResults({ service, query, date, view, subjects, filtered, onDate }: { service: CalendarService; query: CalendarItemsQuery; date: Date; view: CalendarView; subjects: Subject[]; filtered: boolean; onDate: (date: Date) => void }) {
  const { items, error, retry } = useCalendarData(service, query)
  if (error) return <CalendarError message={error} onRetry={retry} />
  if (!items) return <CalendarLoading />
  const props = { days: period(date, view).days, date, subjects, groups: groupCalendar(items) }
  return <>
    <p className={styles.calendarCount} role="status"><span className="visually-hidden">{items.length} elementos en el periodo.</span><span className={styles.legend}><span data-kind="activity" />Actividades<span data-kind="session" />Sesiones</span><span>{items.length} {items.length === 1 ? 'elemento' : 'elementos'} en el periodo</span></p>
    <div className={styles.calendarLayout}>
      <div className={styles.calendarMain}>
        {!items.length && <CalendarEmpty filtered={filtered} />}
        {view === 'month' ? <CalendarMonth {...props} onDate={onDate} /> : <CalendarWeek {...props} onDate={onDate} />}
      </div>
      <CalendarAgenda date={date} items={items} subjects={subjects} />
    </div>
  </>
}
