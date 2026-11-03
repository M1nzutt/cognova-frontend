import { Link } from 'react-router-dom'
import type { CalendarItem } from '../types/calendar'
import type { Subject } from '../types/subject'
import { priorityLabels, statusLabels } from '../utils/activityPresentation'
import { executionStateLabels, sessionResultLabels } from '../utils/studySessionPresentation'
import subjectStyles from './Subjects.module.css'
import styles from './CalendarEvent.module.css'

export function CalendarEvent({ item, subject }: { item: CalendarItem; subject?: Subject }) {
  if (item.type === 'study_session') {
    return <Link className={styles.event} to={'/app/sessions/' + item.id} data-type={item.type}
      aria-label={`Abrir detalle: Sesión de ${subject?.name ?? `Materia ${item.subject_id}`}`}>
      <span className={styles.type}>Sesión de estudio</span>
      <strong>Estudio · {subject?.name ?? `Materia ${item.subject_id}`}</strong>
      <time dateTime={item.planned_start_at}>{new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.planned_start_at))}</time>
      <span className={styles.subject}><span aria-hidden="true" className={subjectStyles.swatch} data-color={subject?.color_base} data-shade={subject?.color_shade} />{subject?.name ?? 'Materia no disponible'}{subject?.status === 'archived' ? ' (archivada)' : ''}</span>
      <span>{item.planned_duration} minutos planificados</span>
      <span>Estado: {executionStateLabels[item.lifecycle]}</span>
      {item.result && <span>Resultado: {sessionResultLabels[item.result]}</span>}
    </Link>
  }
  return <Link className={styles.event} to={'/app/activities/' + item.id} data-type={item.type} data-priority={item.priority}>
    <span className={styles.type}>Actividad</span>
    <strong>{item.title}</strong>
    <time dateTime={item.deadline}>{new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.deadline))}</time>
    <span className={styles.subject}><span aria-hidden="true" className={subjectStyles.swatch} data-color={subject?.color_base} data-shade={subject?.color_shade} />{subject?.name ?? 'Materia no disponible'}{subject?.status === 'archived' ? ' (archivada)' : ''}</span>
    <span>Prioridad {priorityLabels[item.priority].toLocaleLowerCase('es')}</span>
    <span>Estado: {statusLabels[item.status]}</span>
  </Link>
}
