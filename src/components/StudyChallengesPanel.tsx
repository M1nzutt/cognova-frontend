import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import type { StudyPlan } from '../types/studyPlan'
import { useStudyPlanServices } from '../hooks/useStudyPlanServices'
import { useStudyPlanResource } from '../hooks/useStudyPlanResource'
import { useStudyPlanMutation } from '../hooks/useStudyPlanMutation'
import { StudyChallengeForm } from './StudyChallengeForm'
import { aiChallengeContext, challengeGoal, challengeStatusLabels } from '../utils/studyPlanPresentation'
import { localDateTime } from '../utils/studySessionPresentation'
import styles from './StudyPlans.module.css'

export function StudyChallengesPanel({ plan, onChange }: { plan: StudyPlan; onChange: () => void }) {
  const services = useStudyPlanServices()
  const load = useCallback((signal: AbortSignal) => services.challenges.list(plan.id, undefined, signal), [services, plan.id])
  const resource = useStudyPlanResource(load)
  const mutation = useStudyPlanMutation()
  const [creating, setCreating] = useState(false)
  const page = resource.data
  return <section className={styles.panel} aria-labelledby="missions-heading">
    <div className={styles.cardTop}><div><h2 id="missions-heading">Misiones del plan</h2><p>Pasos concretos para avanzar hacia tu objetivo.</p></div>
      {!creating && (plan.status === 'draft' || plan.status === 'active') && <button className={styles.primary} type="button" onClick={() => setCreating(true)}>Añadir misión</button>}
    </div>
    {creating && <StudyChallengeForm plan={plan} busy={mutation.busy} error={mutation.error} onCancel={() => { setCreating(false); mutation.clearError() }} onSave={value => void mutation.run(
      signal => services.challenges.create(plan.id, value, signal),
      () => { setCreating(false); resource.retry(); onChange() },
      async () => { resource.retry(); onChange() },
    )} />}
    {resource.loading && <p role="status">Cargando misiones…</p>}
    {resource.error && <div role="alert"><p>{resource.error}</p><button className="button" type="button" onClick={resource.retry}>Reintentar misiones</button></div>}
    {page && !resource.loading && !resource.error && (page.items.length === 0 ? <p>Este plan todavía no tiene misiones.</p> : <>
      <ul className={styles.list} aria-label="Misiones del plan">{page.items.map(challenge => {
        const aiContext = aiChallengeContext(challenge)
        return <li className={styles.mission} key={challenge.id} id={`mission-${challenge.id}`}>
        <div className={styles.cardTop}><div><p className="eyebrow">{challenge.source === 'ai' ? 'SUGERIDA POR COGNOVA' : 'MISIÓN DEL PLAN'}</p><h3><Link to={`/app/study-plans/${plan.id}/challenges/${challenge.id}`}>{challenge.title}</Link></h3></div><span className={styles.badge}>{challengeStatusLabels[challenge.status]}</span></div>
        <p>{challenge.description}</p>{aiContext.explanation && <p>{aiContext.explanation}</p>}<p><strong>Objetivo:</strong> {challengeGoal(challenge)}</p>
        {aiContext.condition && <p><strong>Condición:</strong> {aiContext.condition}</p>}
        {aiContext.evidence.length > 0 && <ul aria-label="Evidencia de la misión">{aiContext.evidence.map((evidence, index) => <li key={index}>{evidence}</li>)}</ul>}
        {challenge.deadline && <p><strong>Fecha límite:</strong> <time dateTime={challenge.deadline}>{localDateTime(challenge.deadline)}</time></p>}
      </li>})}</ul>
      {page.next_after_id !== null && <button className="button" type="button" disabled={mutation.busy} onClick={() => void mutation.run(
        signal => services.challenges.list(plan.id, page.next_after_id ?? undefined, signal),
        next => resource.setData(previous => previous ? { items: [...previous.items, ...next.items.filter(item => !previous.items.some(old => old.id === item.id))], next_after_id: next.next_after_id } : next),
      )}>Cargar más misiones</button>}
      {mutation.error && !creating && <p role="alert">{mutation.error}</p>}
    </>)}
  </section>
}
