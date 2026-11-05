import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StudyChallengeForm } from '../components/StudyChallengeForm'
import { useStudyPlanServices } from '../hooks/useStudyPlanServices'
import { useStudyPlanResource } from '../hooks/useStudyPlanResource'
import { useStudyPlanMutation } from '../hooks/useStudyPlanMutation'
import { challengeGoal, challengeStatusLabels, sourceLabels } from '../utils/studyPlanPresentation'
import { localDateTime } from '../utils/studySessionPresentation'
import styles from '../components/StudyPlans.module.css'

export function StudyChallengeDetailPage() {
  const { planId, challengeId } = useParams()
  const id = Number(planId), missionId = Number(challengeId)
  const services = useStudyPlanServices()
  const loadPlan = useCallback((signal: AbortSignal) => services.plans.detail(id, signal), [services, id])
  const loadChallenge = useCallback((signal: AbortSignal) => services.challenges.detail(id, missionId, signal), [services, id, missionId])
  const planResource = useStudyPlanResource(loadPlan)
  const resource = useStudyPlanResource(loadChallenge)
  const mutation = useStudyPlanMutation()
  const [editing, setEditing] = useState(false)
  const plan = planResource.data, mission = resource.data
  const transition = (action: 'start' | 'complete' | 'fail' | 'cancel') => void mutation.run(
    signal => services.challenges.transition(id, missionId, action, signal),
    next => { resource.setData(next); planResource.retry() },
    async () => { resource.retry(); planResource.retry() },
  )
  return <section className={styles.page}>
    <Link to={`/app/study-plans/${id}`}>← Volver al plan</Link>
    {(resource.loading || planResource.loading) && <p role="status">Cargando misión…</p>}
    {(resource.error || planResource.error) && <div role="alert"><p>{resource.error || planResource.error}</p><button className="button" type="button" onClick={() => { resource.retry(); planResource.retry() }}>Reintentar</button></div>}
    {mission && plan && !resource.loading && !planResource.loading && !resource.error && !planResource.error && <>
      <div className={styles.heading}><div><p className="eyebrow">MISIÓN DE {plan.name.toUpperCase()}</p><h1>{mission.title}</h1><p>{challengeStatusLabels[mission.status]}</p></div>
        <button className="button" type="button" onClick={() => { resource.retry(); planResource.retry() }}>Actualizar</button></div>
      {mutation.error && <p role="alert" className={styles.error}>{mutation.error}</p>}
      {editing ? <StudyChallengeForm plan={plan} initial={mission} busy={mutation.busy} error={mutation.error} onCancel={() => { setEditing(false); mutation.clearError() }} onSave={value => void mutation.run(
        signal => services.challenges.update(id, missionId, value, signal),
        next => { resource.setData(next); planResource.retry(); setEditing(false) },
        async () => { resource.retry(); planResource.retry() },
      )} /> : <>
        <section className={styles.panel} aria-label="Detalle de la misión">
          <p>{mission.description}</p><dl className={styles.summary}>
            <dt>Estado</dt><dd>{challengeStatusLabels[mission.status]}</dd>
            <dt>Origen</dt><dd>{sourceLabels[mission.source]}</dd>
            <dt>Objetivo</dt><dd>{challengeGoal(mission)}</dd>
            {mission.start_at && <><dt>Inicio</dt><dd><time dateTime={mission.start_at}>{localDateTime(mission.start_at)}</time></dd></>}
            {mission.deadline && <><dt>Fecha límite</dt><dd><time dateTime={mission.deadline}>{localDateTime(mission.deadline)}</time></dd></>}
            {mission.subject_id && <><dt>Materia</dt><dd><Link to={`/app/subjects/${mission.subject_id}`}>{plan.subjects.find(item => item.id === mission.subject_id)?.name ?? 'Ver materia'}</Link></dd></>}
            {mission.activity_id && <><dt>Actividad</dt><dd><Link to={`/app/activities/${mission.activity_id}`}>{plan.activities.find(item => item.id === mission.activity_id)?.title ?? 'Ver actividad'}</Link></dd></>}
            {mission.study_session_id && <><dt>Sesión</dt><dd><Link to={`/app/sessions/${mission.study_session_id}`}>Ver sesión relacionada</Link></dd></>}
          </dl>
        </section>
        {plan.status === 'active' && <div className={styles.actions} aria-label="Acciones de la misión">
          {mission.status === 'pending' && <><button className="button" type="button" disabled={mutation.busy} onClick={() => setEditing(true)}>Editar misión</button><button className={styles.primary} type="button" disabled={mutation.busy} onClick={() => transition('start')}>Iniciar misión</button></>}
          {mission.status === 'in_progress' && <><button className={styles.primary} type="button" disabled={mutation.busy} onClick={() => transition('complete')}>Completar misión</button><button className="button" type="button" disabled={mutation.busy} onClick={() => transition('fail')}>Marcar como fallida</button></>}
          {(mission.status === 'pending' || mission.status === 'in_progress') && <button className="button" type="button" disabled={mutation.busy} onClick={() => transition('cancel')}>Cancelar misión</button>}
        </div>}
      </>}
    </>}
  </section>
}
