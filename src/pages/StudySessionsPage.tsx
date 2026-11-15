import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { StudySessionFilters } from '../components/StudySessionFilters'
import { useStudySessionList } from '../hooks/useStudySessionList'
import { useStudySessionResource } from '../hooks/useStudySessionResource'
import { useStudySessionServices } from '../hooks/useStudySessionServices'
import type { StudySessionFilters as Filters } from '../types/studySession'
import { executionStateLabels, formatDuration, localDateTime, sessionResultLabels } from '../utils/studySessionPresentation'
import styles from '../components/StudySessions.module.css'
import { LoadingStatus } from '../components/LoadingStatus'

export function StudySessionsPage() {
  const services = useStudySessionServices()
  const loadSubjects = useCallback((signal: AbortSignal) => services.loadSubjects(signal), [services])
  const subjects = useStudySessionResource(loadSubjects)
  const [filters, setFilters] = useState<Filters>({})
  const query = useStudySessionList(services.sessions, filters)
  const subjectName = (id: number) => subjects.data?.find(subject => subject.id === id)?.name ?? `Materia ${id}`
  const hasFilters = Object.values(filters).some(Boolean)
  return <section className={styles.page}>
    <header className={styles.hero}>
      <div><p className="eyebrow">TU TIEMPO, A TU RITMO</p><h1>Sesiones de estudio</h1><p>Reserva un espacio, concéntrate y conserva lo que realmente ocurrió.</p></div>
      <Link className={styles.primary} to="/app/sessions/new"><span aria-hidden="true">＋</span> Planificar sesión</Link>
    </header>
    {subjects.error && <div role="alert"><p>{subjects.error}</p><button className="button" type="button" onClick={subjects.retry}>Reintentar materias</button></div>}
    {query.data?.active && <section className={styles.panel} aria-labelledby="active-session-title">
      <p className={styles.badge}>EN {executionStateLabels[query.data.active.execution_state].toUpperCase()}</p>
      <div className={styles.activeContent}><div><h2 id="active-session-title">Tu sesión sigue aquí</h2>
        <p>{subjectName(query.data.active.subject_id)} · {query.data.active.planned_duration} min reservados</p>
        <p className={styles.confirmed}>Tiempo efectivo confirmado: <strong>{formatDuration(Math.floor(Number(query.data.active.actual_duration)))}</strong></p>
      </div><Link className={styles.activeAction} to={`/app/sessions/${query.data.active.id}`}>Abrir temporizador <span aria-hidden="true">→</span></Link></div>
    </section>}
    <StudySessionFilters subjects={subjects.data ?? []} onApply={setFilters} onClear={() => setFilters({})} />
    {query.loading && <LoadingStatus label="Cargando sesiones…" />}
    {query.error && <div role="alert"><p>{query.error}</p><button className="button" type="button" onClick={query.retry}>Reintentar sesiones</button></div>}
    {query.data && !query.loading && !query.error && query.data.items.length === 0 && <div className={styles.empty}><span className={styles.emptyMark} aria-hidden="true">◷</span><h2>{hasFilters ? 'No hay sesiones con estos filtros' : 'Tu próximo espacio empieza aquí'}</h2><p>{hasFilters ? 'Prueba otros criterios o limpia los filtros para volver a ver tus sesiones.' : 'Planifica un tiempo posible para tu próximo momento de estudio.'}</p><Link to="/app/sessions/new">{hasFilters ? 'Planificar una sesión' : 'Planificar mi primera sesión'}</Link></div>}
    {query.data && query.data.items.length > 0 && <>
      <ul className={styles.list} aria-label="Lista de sesiones">
        {query.data.items.map(item => <li key={item.id}><Link className={styles.card} to={`/app/sessions/${item.id}`}>
          <h2>Sesión de {subjectName(item.subject_id)}</h2>
          <div className={styles.meta}><span className={styles.badge}>{executionStateLabels[item.execution_state]}</span>{item.status && <span className={styles.badge}>{sessionResultLabels[item.status]}</span>}<span><time dateTime={item.planned_start_at}>{localDateTime(item.planned_start_at)}</time></span><span>{item.planned_duration} min planificados</span><span>{formatDuration(Math.floor(Number(item.actual_duration)))} efectivos</span></div>
        </Link></li>)}
      </ul>
      {query.data.cursor && <button className="button" type="button" disabled={query.loadingMore} onClick={() => void query.loadMore()}>{query.loadingMore ? 'Cargando…' : 'Cargar más sesiones'}</button>}
    </>}
  </section>
}
