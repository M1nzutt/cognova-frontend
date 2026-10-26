import type { CalendarFilters as Filters } from '../types/calendar'
import type { Subject } from '../types/subject'
import { activityPriorities, activityStatuses } from '../types/activity'
import { priorityLabels, statusLabels } from '../utils/activityPresentation'
import styles from './Activities.module.css'
export function CalendarFilters({ value, subjects, onChange }: { value: Filters; subjects: Subject[]; onChange: (value: Filters) => void }) {
  return <form className={styles.filters} aria-label="Filtros del calendario" onSubmit={e => e.preventDefault()}>
    <div className={styles.form}><div className={styles.columns}>
      <label>Materia<select aria-label="Filtrar por materia" value={value.subject_id ?? ''} onChange={e => onChange({ ...value, subject_id: e.target.value ? Number(e.target.value) : undefined })}>
        <option value="">Todas las materias</option>
        {value.subject_id && !subjects.some(s => s.id === value.subject_id) && <option value={value.subject_id}>Materia no disponible</option>}
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.status === 'archived' ? ' (archivada)' : ''}</option>)}
      </select></label>
      <label>Estado<select aria-label="Filtrar por estado" value={value.status ?? ''} onChange={e => onChange({ ...value, status: e.target.value as Filters['status'] || undefined })}><option value="">Todos los estados</option>{activityStatuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></label>
      <label>Prioridad<select aria-label="Filtrar por prioridad" value={value.priority ?? ''} onChange={e => onChange({ ...value, priority: e.target.value as Filters['priority'] || undefined })}><option value="">Todas las prioridades</option>{activityPriorities.map(p => <option key={p} value={p}>{priorityLabels[p]}</option>)}</select></label>
    </div></div>
    <button className="button" type="button" onClick={() => onChange({})}>Limpiar filtros</button>
  </form>
}
