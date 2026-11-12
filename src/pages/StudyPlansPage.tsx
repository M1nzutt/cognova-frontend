import { useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStudyPlanServices } from '../hooks/useStudyPlanServices'
import { useStudyPlanResource } from '../hooks/useStudyPlanResource'
import { useStudyPlanMutation } from '../hooks/useStudyPlanMutation'
import { planStatuses } from '../types/studyPlan'
import type { PlanStatus } from '../types/studyPlan'
import { planStatusLabels, sourceLabels } from '../utils/studyPlanPresentation'
import { localDateTime } from '../utils/studySessionPresentation'
import styles from '../components/StudyPlans.module.css'

export function StudyPlansPage() {
  const services = useStudyPlanServices()
  const [params, setParams] = useSearchParams()
  const rawStatus = params.get('status')
  const status: PlanStatus | 'all' = planStatuses.some(value => value === rawStatus) ? rawStatus as PlanStatus : 'all'
  const load = useCallback((signal: AbortSignal) => services.plans.list(status, undefined, signal), [services, status])
  const resource = useStudyPlanResource(load)
  const more = useStudyPlanMutation()
  const generate = useStudyPlanMutation()
  const navigate = useNavigate()
  const page = resource.data
  const changeStatus = (value: PlanStatus | 'all') => setParams(value === 'all' ? {} : { status: value })

  return <section className={styles.page}>
    <div className={styles.heading}>
      <div><p className="eyebrow">TU PRÓXIMO PASO</p><h1>Planes de estudio</h1><p>Organiza materias, actividades y sesiones en un solo recorrido.</p></div>
      <div className={styles.actions}>
        <Link className="button" to="/app/study-plans/new">Crear plan</Link>
        <button className={styles.primary} type="button" disabled={generate.busy} aria-busy={generate.busy}
          onClick={() => void generate.run(signal => services.plans.generate(signal), result => navigate(`/app/study-plans/${result.plan.id}`))}>
          {generate.busy ? 'Preparando propuesta…' : 'Proponer un plan con IA'}
        </button>
      </div>
    </div>
    <p className={styles.muted}>La IA prepara un borrador para que lo revises. Solo tú decides si lo aceptas.</p>
    {generate.error && <p role="alert" className={styles.error}>{generate.error}</p>}
    <div className={styles.filters}>
      <label htmlFor="plan-status">Ver planes</label>
      <select id="plan-status" value={status} onChange={event => changeStatus(event.target.value as PlanStatus | 'all')}>
        <option value="all">Todos</option>
        {planStatuses.map(value => <option value={value} key={value}>{planStatusLabels[value]}</option>)}
      </select>
      <button className="button" type="button" onClick={resource.retry}>Actualizar</button>
    </div>
    {resource.loading && <p role="status">Cargando planes…</p>}
    {resource.error && <div role="alert"><p>{resource.error}</p><button className="button" type="button" onClick={resource.retry}>Reintentar planes</button></div>}
    {page && !resource.loading && !resource.error && (page.items.length === 0
      ? <div className={styles.empty}><h2>{status === 'all' ? 'Tu primer plan empieza aquí' : 'No hay planes con este estado'}</h2><p>Organiza un objetivo y vincula tus recursos de estudio.</p><Link to="/app/study-plans/new">Crear plan manual</Link></div>
      : <><p role="status">{page.items.length} planes mostrados{page.next_after_id ? '; hay más disponibles' : ''}.</p>
        <ul className={styles.list} aria-label="Planes de estudio">
          {page.items.map(plan => <li key={plan.id}><Link className={styles.card} to={`/app/study-plans/${plan.id}`}>
            <div className={styles.cardTop}><h2>{plan.name}</h2><span className={styles.badge}>{planStatusLabels[plan.status]}</span></div>
            <p>{plan.objective}</p>
            <div className={styles.meta}><span>{sourceLabels[plan.source]}</span><span><time dateTime={plan.start_at}>{localDateTime(plan.start_at)}</time> → <time dateTime={plan.end_at}>{localDateTime(plan.end_at)}</time></span></div>
          </Link></li>)}
        </ul>
        {page.next_after_id !== null && <button className="button" type="button" disabled={more.busy} onClick={() => void more.run(
          signal => services.plans.list(status, page.next_after_id ?? undefined, signal),
          next => resource.setData(previous => previous ? { items: [...previous.items, ...next.items.filter(item => !previous.items.some(old => old.id === item.id))], next_after_id: next.next_after_id } : next),
        )}>{more.busy ? 'Cargando…' : 'Cargar más planes'}</button>}
        {more.error && <p role="alert">{more.error}</p>}
      </>)}
  </section>
}
