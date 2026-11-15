import { Link } from 'react-router-dom'
import type { CalendarItem } from '../types/calendar'
import type { Subject } from '../types/subject'
import { priorityLabels, statusLabels } from '../utils/activityPresentation'
import { executionStateLabels, sessionResultLabels } from '../utils/studySessionPresentation'
import subjectStyles from './Subjects.module.css'
import styles from './CalendarEvent.module.css'

export function CalendarEvent({ item, subject, compact = false }: { item: CalendarItem; subject?: Subject; compact?: boolean }) {
  if (item.type === 'study_session') {
    return <Link className={styles.event} to={'/app/sessions/' + item.id} data-type={item.type} data-compact={compact || undefined}>
      <span className={styles.type}>Sesión de estudio</span>
      <strong>Estudio · {subject?.name ?? `Materia ${item.subject_id}`}</strong>
      <span className={compact ? styles.compactTime : undefined}>{compact ? 'Sesión' : 'Hora planificada'} · <time dateTime={item.planned_start_at}>{new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.planned_start_at))}</time></span>
      {!compact && <>
      <span className={styles.subject}><span aria-hidden="true" className={subjectStyles.swatch} data-color={subject?.color_base} data-shade={subject?.color_shade} />Materia: {subject?.name ?? 'Materia no disponible'}{subject?.status === 'archived' ? ' (archivada)' : ''}</span>
      <span>Duración planificada: {item.planned_duration} minutos</span>
      <span>Estado: {executionStateLabels[item.lifecycle]}</span>
      {item.result && <span>Resultado: {sessionResultLabels[item.result]}</span>}
      </>}
    </Link>
  }
  return <Link className={styles.event} to={'/app/activities/' + item.id} data-type={item.type} data-priority={item.priority} data-compact={compact || undefined}>
    <span className={styles.type}>Actividad</span>
    <strong>{item.title}</strong>
    <span className={compact ? styles.compactTime : undefined}><time dateTime={item.deadline}>{new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.deadline))}</time>{compact && <span aria-hidden="true"> · Actividad</span>}</span>
    {!compact && <span className={styles.subject}><span aria-hidden="true" className={subjectStyles.swatch} data-color={subject?.color_base} data-shade={subject?.color_shade} />{subject?.name ?? 'Materia no disponible'}{subject?.status === 'archived' ? ' (archivada)' : ''}</span>}
    {!compact && <>
    <span>Prioridad {priorityLabels[item.priority].toLocaleLowerCase('es')}</span>
    <span>Estado: {statusLabels[item.status]}</span>
    </>}
  </Link>
}
