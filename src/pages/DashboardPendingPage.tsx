import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarService } from '../services/CalendarService'
import type { CalendarItem } from '../types/calendar'
import { useAuth } from '../hooks/useAuth'
import { useCalendarData } from '../hooks/useCalendarData'
import { calendarItemDate, dayKey, period } from '../utils/calendarDates'
import styles from './DashboardPendingPage.module.css'

function todayLabel(date: Date): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function itemLabel(item: CalendarItem): string {
  return item.type === 'activity' ? item.title : 'Sesión de estudio'
}

function itemTime(item: CalendarItem): string {
  const date = new Date(calendarItemDate(item))
  const label = new Intl.DateTimeFormat('es', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
  return item.type === 'activity' ? `Fecha límite · ${label}` : label
}

export function DashboardPendingPage() {
  const { user, session } = useAuth()
  const service = useMemo(() => new CalendarService(session.api), [session])
  const range = useMemo(() => period(new Date(), 'week').query, [])
  const { items, error, retry } = useCalendarData(service, range)
  const today = new Date()
  const todayItems = (items ?? [])
    .filter(item => dayKey(new Date(calendarItemDate(item))) === dayKey(today))
    .sort((left, right) =>
      new Date(calendarItemDate(left)).getTime() - new Date(calendarItemDate(right)).getTime(),
    )

  return <section className={styles.dashboard} aria-labelledby="dashboard-title">
    <header className={styles.heading}>
      <div>
        <p className="eyebrow">TU ESPACIO ACADÉMICO</p>
        <h1 id="dashboard-title">Hola, {user?.name}.</h1>
        <p>Este es tu punto de partida. ¿Qué te gustaría avanzar hoy?</p>
      </div>
      <span className={styles.date}>{todayLabel(today)}</span>
    </header>

    <section className={styles.today} aria-labelledby="today-title">
      <div className={styles.todayHeading}>
        <div>
          <p className="eyebrow">PARA HOY</p>
          <h2 id="today-title">Tu día, paso a paso</h2>
        </div>
        <Link to="/app/calendar">Ver calendario <span aria-hidden="true">→</span></Link>
      </div>
      {items === null && !error && <p role="status">Buscando lo que tienes para hoy…</p>}
      {error && <div className={styles.todayEmpty} role="status">
        <p>No pudimos cargar tu agenda ahora.</p>
        <button className="button" type="button" onClick={retry}>Intentar de nuevo</button>
      </div>}
      {items !== null && !error && todayItems.length === 0 && <div className={styles.todayEmpty}>
        <p>No tienes actividades con fecha límite ni sesiones agendadas para hoy.</p>
        <p>Si quieres, puedes reservar un momento para estudiar o dejar el día libre.</p>
        <Link to="/app/sessions/new">Agendar una sesión</Link>
      </div>}
      {todayItems.length > 0 && <ol className={styles.todayList}>
        {todayItems.map(item => {
          const href = item.type === 'activity'
            ? `/app/activities/${item.id}`
            : `/app/sessions/${item.id}`
          return <li key={`${item.type}-${item.id}`}>
            <span className={styles.itemTime}>{itemTime(item)}</span>
            <span className={styles.itemMark} aria-hidden="true">{item.type === 'activity' ? '•' : '◷'}</span>
            <Link to={href}>
              <strong>{itemLabel(item)}</strong>
              <small>{item.type === 'activity' ? 'Actividad · abrir detalle' : `${item.planned_duration} min · abrir sesión`}</small>
            </Link>
          </li>
        })}
      </ol>}
    </section>

    <section className={styles.perception} aria-labelledby="perception-title">
      <div>
        <p className="eyebrow">TU RECORRIDO</p>
        <h2 id="perception-title">Tu perspectiva también cambia.</h2>
        <p>Vuelve a tus respuestas iniciales cuando quieras y observa qué ha cambiado para ti.</p>
      </div>
      <Link to="/app/questionnaire">Ver mi recorrido <span aria-hidden="true">→</span></Link>
    </section>

    <section className={styles.next} aria-labelledby="next-title">
      <div className={styles.nextHeading}>
        <div><span className={styles.release}>ELIGE UN SIGUIENTE PASO</span><h2 id="next-title">¿En qué te acompaño?</h2></div>
        <p>Empieza por algo pequeño. Puedes cambiar de idea cuando quieras.</p>
      </div>
      <div className={styles.quickActions}>
        <Link className={`${styles.quickAction} ${styles.featuredAction}`} to="/app/companion">
          <span><strong>Conversar con Cognova</strong><small>Piensa en tus pendientes o en cómo te fue</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
        </Link>
        <Link className={styles.quickAction} to="/app/activities">
          <span><strong>Revisar actividades</strong><small>Decide qué quieres atender primero</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
        </Link>
        <Link className={styles.quickAction} to="/app/study-plans">
          <span><strong>Mirar mis planes</strong><small>Continúa desde donde lo dejaste</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
        </Link>
        <Link className={styles.quickAction} to="/app/behavior">
          <span><strong>Hacer una pausa y reflexionar</strong><small>Explora preguntas sobre tus sesiones</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  </section>
}
