import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StudyPlanOverview } from '../components/StudyPlanOverview'
import { StudyPlanForm } from '../components/StudyPlanForm'
import { StudyChallengesPanel } from '../components/StudyChallengesPanel'
import { useStudyPlanServices } from '../hooks/useStudyPlanServices'
import { useStudyPlanResource } from '../hooks/useStudyPlanResource'
import { useStudyPlanMutation } from '../hooks/useStudyPlanMutation'
import { planStatusLabels } from '../utils/studyPlanPresentation'
import styles from '../components/StudyPlans.module.css'

export function StudyPlanDetailPage() {
  const { planId } = useParams()
  const id = Number(planId)
  const services = useStudyPlanServices()
  const load = useCallback((signal: AbortSignal) => services.plans.detail(id, signal), [services, id])
  const resource = useStudyPlanResource(load)
  const choicesLoad = useCallback((signal: AbortSignal) => services.loadChoices(signal), [services])
  const choices = useStudyPlanResource(choicesLoad)
  const mutation = useStudyPlanMutation()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const deleteTrigger = useRef<HTMLButtonElement>(null)
  const confirmButton = useRef<HTMLButtonElement>(null)
  const plan = resource.data
  useEffect(() => { if (confirming) confirmButton.current?.focus() }, [confirming])

  const transition = (action: 'activate' | 'complete' | 'abandon' | 'accept' | 'reject' | 'regenerate') => void mutation.run(
    signal => services.plans.transition(id, action, signal),
    next => resource.setData(next),
    async () => { resource.retry() },
  )
  const canDelete = plan?.source === 'manual' && plan.status === 'draft' && !plan.subjects.length
    && !plan.activities.length && !plan.study_sessions.length && !plan.decisions.length && plan.challenge_count === 0

  return <section className={styles.page}>
    <Link to="/app/study-plans">← Planes de estudio</Link>
    {resource.loading && <p role="status">Cargando plan…</p>}
    {resource.error && <div role="alert"><p>{resource.error}</p><button className="button" type="button" onClick={resource.retry}>Reintentar plan</button></div>}
    {plan && !resource.loading && !resource.error && <>
      <div className={styles.heading}><div><p className="eyebrow">TU RECORRIDO</p><h1>{plan.name}</h1><p>{planStatusLabels[plan.status]}</p></div>
        <button className="button" type="button" onClick={resource.retry}>Actualizar</button></div>
      {mutation.error && <p role="alert" className={styles.error}>{mutation.error}</p>}
      {editing ? <>
        <h2>Editar borrador</h2>
        {choices.loading && <p role="status">Cargando recursos…</p>}
        {choices.error && <div role="alert"><p>{choices.error}</p><button className="button" type="button" onClick={choices.retry}>Reintentar recursos</button></div>}
        {choices.data && <StudyPlanForm key={plan.updated_at} {...choices.data} initial={plan} busy={mutation.busy} error={mutation.error}
          onCancel={() => { setEditing(false); mutation.clearError() }} onSave={value => void mutation.run(
            signal => services.plans.update(id, value, signal),
            next => { resource.setData(next); setEditing(false) },
            async () => { resource.retry() },
          )} />}
      </> : <>
        <div className={styles.actions} aria-label="Acciones del plan">
          {plan.status === 'draft' && <button className="button" type="button" onClick={() => { mutation.clearError(); setEditing(true) }}>Editar borrador</button>}
          {plan.status === 'draft' && plan.source === 'manual' && <button className={styles.primary} type="button" disabled={mutation.busy} onClick={() => transition('activate')}>Activar plan</button>}
          {plan.status === 'draft' && plan.source === 'ai' && <>
            <button className={styles.primary} type="button" disabled={mutation.busy} onClick={() => transition('accept')}>Aceptar propuesta</button>
            <button className="button" type="button" disabled={mutation.busy} onClick={() => transition('reject')}>Rechazar propuesta</button>
            <button className="button" type="button" disabled={mutation.busy} onClick={() => transition('regenerate')}>Pedir otra propuesta</button>
          </>}
          {plan.status === 'active' && <button className={styles.primary} type="button" disabled={mutation.busy} onClick={() => transition('complete')}>Completar plan</button>}
          {(plan.status === 'draft' || plan.status === 'active') && <button className="button" type="button" disabled={mutation.busy} onClick={() => transition('abandon')}>Abandonar plan</button>}
        </div>
        <StudyPlanOverview plan={plan} />
        <StudyChallengesPanel plan={plan} onChange={resource.retry} />
        {canDelete && <div className={styles.dangerZone}><h2>Eliminar borrador</h2><p>Solo puedes eliminar un borrador sin recursos, misiones ni decisiones.</p>
          <button ref={deleteTrigger} className={styles.danger} type="button" onClick={() => setConfirming(true)}>Eliminar plan</button></div>}
      </>}
      {confirming && canDelete && <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="delete-plan-heading">
        <div className={styles.confirm}><h2 id="delete-plan-heading">¿Eliminar este borrador?</h2><p>Esta acción no se puede deshacer.</p>
          <div className={styles.actions}><button ref={confirmButton} className={styles.danger} type="button" disabled={mutation.busy} onClick={() => void mutation.run(
            signal => services.plans.remove(id, true, signal),
            () => navigate('/app/study-plans', { replace: true }),
            async () => { setConfirming(false); resource.retry() },
          )}>Sí, eliminar</button>
            <button className="button" type="button" disabled={mutation.busy} onClick={() => { setConfirming(false); deleteTrigger.current?.focus() }}>Cancelar</button></div>
        </div></div>}
    </>}
  </section>
}
