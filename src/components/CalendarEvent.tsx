import { Link } from 'react-router-dom'
import type { CalendarActivity } from '../types/calendar'
import type { Subject } from '../types/subject'
import { priorityLabels, statusLabels } from '../utils/activityPresentation'
import subjectStyles from './Subjects.module.css'
import styles from './CalendarEvent.module.css'

export function CalendarEvent({ item, subject }: { item: CalendarActivity; subject?: Subject }) {
  return <Link className={styles.event} to={'/app/activities/' + item.id} data-priority={item.priority}>
    <strong>{item.title}</strong>
    <time dateTime={item.deadline}>{new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.deadline))}</time>
    <span className={styles.subject}><span aria-hidden="true" className={subjectStyles.swatch} data-color={subject?.color_base} data-shade={subject?.color_shade} />{subject?.name ?? 'Materia no disponible'}{subject?.status === 'archived' ? ' (archivada)' : ''}</span>
    <span>Prioridad {priorityLabels[item.priority].toLocaleLowerCase('es')}</span>
    <span>{statusLabels[item.status]}</span>
  </Link>
}
