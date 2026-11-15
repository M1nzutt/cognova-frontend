import { useCallback, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ActivityFilters } from '../components/ActivityFilters'
import { useActivityServices } from '../hooks/useActivityServices'
import { useActivityResource } from '../hooks/useActivityResource'
import { useActivityMutation } from '../hooks/useActivityMutation'
import type { ActivityFilters as Filters } from '../types/activity'
import type { Subject } from '../types/subject'
import type { ActivityService } from '../services/ActivityService'
import { dateLabel, priorityLabels, statusLabels } from '../utils/activityPresentation'
import styles from '../components/Activities.module.css'
import { LoadingStatus } from '../components/LoadingStatus'
export function ActivitiesPage() {
  const { service, loadSubjects } = useActivityServices(), subjects = useActivityResource(loadSubjects), location = useLocation()
  const [filters, setFilters] = useState<Filters>({}), [revision, setRevision] = useState(0)
  return <section className={styles.page}><header className={styles.hero}>
    <div><p className="eyebrow">TU RECORRIDO ACADÉMICO</p><h1>Actividades</h1><p>Convierte lo que tienes por hacer en próximos pasos concretos.</p></div>
    <Link className={styles.primary} to="/app/activities/new"><span aria-hidden="true">＋</span> Nueva actividad</Link>
  </header>
    {location.state?.activityDeleted && <p role="status">Actividad eliminada.</p>}
    {subjects.loading && <LoadingStatus label="Cargando materias…" />}{subjects.error && <div role="alert"><p>{subjects.error}</p><button className="button" onClick={subjects.retry}>Reintentar materias</button></div>}
    {subjects.data && <ActivityFilters subjects={subjects.data} onApply={f => { setFilters(f); setRevision(r => r+1) }} />}
    <ActivityResults key={revision} service={service} filters={filters} subjects={subjects.data ?? []} />
  </section>
}
function ActivityResults({ service, filters, subjects }: { service: ActivityService; filters: Filters; subjects: Subject[] }) {
  const load = useCallback((signal: AbortSignal) => service.list(filters, undefined, signal), [service, filters])
  const { data, setData, loading, error, retry } = useActivityResource(load), more = useActivityMutation()
  return <>{loading && <LoadingStatus label="Cargando actividades…" />}{error && <div role="alert"><p>{error}</p><button className="button" onClick={retry}>Reintentar actividades</button></div>}
     {data && !loading && <>{!data.items.length ? <div className={styles.empty}><span className={styles.emptyMark} aria-hidden="true">＋</span><h2>{Object.keys(filters).length ? 'No hay actividades con estos filtros' : 'Tu próximo paso empieza aquí'}</h2><p>{Object.keys(filters).length ? 'Prueba otro intervalo o limpia los filtros.' : 'Crea tu primera actividad para organizar tu trabajo.'}</p>{!Object.keys(filters).length && <Link className={styles.emptyAction} to="/app/activities/new">Crear una actividad</Link>}</div> : <><p role="status" className={styles.resultCount}>{data.items.length} actividades mostradas{data.next_after_id ? '; hay más disponibles' : ''}.</p><ul className={styles.list}>{data.items.map(item => <li key={item.id}><Link className={styles.card} to={'/app/activities/' + item.id}><h2>{item.title}</h2><p>{subjects.find(s => s.id === item.subject_id)?.name ?? 'Materia'}</p><div className={styles.meta}><span className={styles.status}>{statusLabels[item.status]}</span><span className={styles.priority}>Prioridad {priorityLabels[item.priority].toLocaleLowerCase('es')}</span><span>{item.estimated_duration} min</span><time dateTime={item.deadline}>Límite: {dateLabel(item.deadline)}</time></div></Link></li>)}</ul></>}
    {data.next_after_id !== null && <button className="button" disabled={more.busy} onClick={() => void more.run(signal => service.list(filters, data.next_after_id ?? undefined, signal), page => setData(old => old ? { ...page, items: [...old.items, ...page.items.filter(i => !old.items.some(o => o.id === i.id))] } : page))}>{more.busy ? 'Cargando…' : 'Cargar más actividades'}</button>}{more.error && <p role="alert">{more.error}</p>}</>}
  </>
}
