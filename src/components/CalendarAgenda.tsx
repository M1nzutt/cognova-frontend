import { Link } from 'react-router-dom'
import type { CalendarItem } from '../types/calendar'
import type { Subject } from '../types/subject'
import { fullDay } from '../utils/calendarDates'
import { priorityLabels, statusLabels } from '../utils/activityPresentation'
import { executionStateLabels, sessionResultLabels } from '../utils/studySessionPresentation'
import styles from './CalendarAgenda.module.css'

export function CalendarAgenda({ date, items, subjects }: { date: Date; items: CalendarItem[]; subjects: Subject[] }) {
  const dayEvents = items.filter(item => {
    const instant = item.type === 'activity' ? item.deadline : item.planned_start_at
    return new Date(instant).getFullYear() === date.getFullYear()
      && new Date(instant).getMonth() === date.getMonth()
      && new Date(instant).getDate() === date.getDate()
  })

  return <aside className={styles.agenda} aria-label="Agenda del día">
    <div className={styles.agendaHeading}>
      <div>
        <p className="eyebrow">AGENDA DEL DÍA</p>
        <h2 id="calendar-agenda-title">{fullDay(date)}</h2>
      </div>
      <span className={styles.count}>{dayEvents.length}</span>
    </div>
    <p className={styles.caption}>{dayEvents.length === 1 ? '1 elemento programado' : `${dayEvents.length} elementos programados`}</p>
    {dayEvents.length ? <ul className={styles.events}>{dayEvents.map(item => {
      const subject = subjects.find(value => value.id === item.subject_id)
      const instant = item.type === 'activity' ? item.deadline : item.planned_start_at
      const href = item.type === 'activity' ? `/app/activities/${item.id}` : `/app/sessions/${item.id}`
      return <li key={`${item.type}:${item.id}`} data-type={item.type}>
        <span className={styles.kind}>{item.type === 'activity' ? 'Actividad' : 'Sesión de estudio'}</span>
        <h3>{item.type === 'activity' ? item.title : `Estudio · ${subject?.name ?? `Materia ${item.subject_id}`}`}</h3>
        <p className={styles.eventMeta}>
          <time dateTime={instant}>{new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(instant))}</time>
          <span className={styles.subject}>{subject?.name ?? 'Materia no disponible'}</span>
        </p>
        {item.type === 'activity'
          ? <p className={styles.eventMeta}>Prioridad {priorityLabels[item.priority].toLocaleLowerCase('es')} · {statusLabels[item.status]}</p>
          : <p className={styles.eventMeta}>Estado: {executionStateLabels[item.lifecycle]}{item.result ? ` · Resultado: ${sessionResultLabels[item.result]}` : ''} · Duración planificada: {item.planned_duration} minutos</p>}
        <Link className={styles.openLink} to={href}>Abrir {item.type === 'activity' ? 'actividad' : 'sesión'} <span aria-hidden="true">→</span></Link>
      </li>
    })}</ul> : <div className={styles.empty}>
      <span className={styles.emptyGlyph} aria-hidden="true">✦</span>
      <h3>Un poco de espacio para ti</h3>
      <p>No hay actividades ni sesiones en este día.</p>
      <Link to="/app/activities/new">Planificar una actividad <span aria-hidden="true">→</span></Link>
    </div>}
    <p className={styles.note}>El calendario organiza tus recursos; para editarlos, abre el detalle de cada elemento.</p>
  </aside>
}
