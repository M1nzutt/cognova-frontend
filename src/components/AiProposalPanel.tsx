import { Link } from 'react-router-dom'
import type { AiProposedChallenge, AiPlanProposalSnapshot } from '../types/ai'
import type { StudyPlan } from '../types/studyPlan'
import { targetLabels } from '../utils/studyPlanPresentation'
import { localDateTime } from '../utils/studySessionPresentation'
import styles from './StudyPlans.module.css'

function dateLabel(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(date)
}

function resourceLabel(plan: StudyPlan, kind: 'subject' | 'activity' | 'study_session', id: number): string {
  if (kind === 'subject') return plan.subjects.find(item => item.id === id)?.name ?? 'Materia que ya no está vinculada'
  if (kind === 'activity') return plan.activities.find(item => item.id === id)?.title ?? 'Actividad que ya no está vinculada'
  const session = plan.study_sessions.find(item => item.id === id)
  return session ? `Sesión del ${localDateTime(session.planned_start_at)}` : 'Sesión que ya no está vinculada'
}

function linkFor(plan: StudyPlan, challenge: AiProposedChallenge) {
  if (challenge.activity_id !== null) return { href: `/app/activities/${challenge.activity_id}`, text: resourceLabel(plan, 'activity', challenge.activity_id) }
  if (challenge.session_id !== null) return { href: `/app/sessions/${challenge.session_id}`, text: resourceLabel(plan, 'study_session', challenge.session_id) }
  if (challenge.subject_id !== null) return { href: `/app/subjects/${challenge.subject_id}`, text: resourceLabel(plan, 'subject', challenge.subject_id) }
  if (challenge.target_id !== null && challenge.target_type === 'activity_completion') return { href: `/app/activities/${challenge.target_id}`, text: 'Ver actividad relacionada' }
  if (challenge.target_id !== null && challenge.target_type === 'session_completion') return { href: `/app/sessions/${challenge.target_id}`, text: 'Ver sesión relacionada' }
  if (challenge.target_id !== null && challenge.target_type === 'subject_mastery') return { href: `/app/subjects/${challenge.target_id}`, text: 'Ver materia relacionada' }
  return null
}

function ProposalResources({ plan, snapshot }: { plan: StudyPlan; snapshot: AiPlanProposalSnapshot }) {
  const groups = [
    { label: 'Materias', kind: 'subject' as const, ids: snapshot.plan.subject_ids },
    { label: 'Actividades', kind: 'activity' as const, ids: snapshot.plan.activity_ids },
    { label: 'Sesiones', kind: 'study_session' as const, ids: snapshot.plan.session_ids },
  ]
  return <div className={styles.sections}>
    {groups.map(group => <div key={group.kind}><h4>{group.label}</h4>
      {group.ids.length === 0 ? <p className={styles.muted}>Ninguna en la propuesta original.</p> : <ul className={styles.resourceList}>
        {group.ids.map(id => {
          const path = group.kind === 'subject' ? `/app/subjects/${id}` : group.kind === 'activity' ? `/app/activities/${id}` : `/app/sessions/${id}`
          return <li key={id}><Link to={path}>{resourceLabel(plan, group.kind, id)}</Link></li>
        })}
      </ul>}
    </div>)}
  </div>
}

export function AiProposalPanel({ plan }: { plan: StudyPlan }) {
  if (plan.source !== 'ai') return null
  const snapshot = plan.ai_proposal_snapshot
  if (!snapshot) return <section className={styles.panel} aria-labelledby="ai-proposal-heading">
    <h2 id="ai-proposal-heading">Propuesta de IA</h2>
    <p>Este plan no tiene una propuesta original guardada para consultar.</p>
  </section>

  const original = snapshot.plan
  const originalDates = `${dateLabel(original.start_date)} – ${dateLabel(original.end_date)}`
  const currentDates = `${localDateTime(plan.start_at)} – ${localDateTime(plan.end_at)}`
  return <section className={styles.panel} aria-labelledby="ai-proposal-heading">
    <p className="eyebrow">BORRADOR PARA TU REVISIÓN</p>
    <h2 id="ai-proposal-heading">Propuesta original de Cognova</h2>
    <p>{snapshot.explanation}</p>
    <details open>
      <summary>Cómo se preparó esta propuesta</summary>
      <p>{snapshot.reasoning_summary}</p>
    </details>
    <h3>Propuesta inicial y plan actual</h3>
    <dl className={styles.summary}>
      <dt>Nombre original</dt><dd>{original.name}</dd>
      <dt>Nombre actual</dt><dd>{plan.name}</dd>
      <dt>Objetivo original</dt><dd>{original.objective}</dd>
      <dt>Objetivo actual</dt><dd>{plan.objective}</dd>
      <dt>Fechas originales</dt><dd>{originalDates}</dd>
      <dt>Fechas actuales</dt><dd>{currentDates}</dd>
    </dl>
    <h3>Recursos que propuso</h3>
    <ProposalResources plan={plan} snapshot={snapshot} />
    <h3>Misiones sugeridas originalmente</h3>
    {snapshot.proposed_challenges.length === 0 ? <p>No se sugirieron misiones para esta propuesta.</p> :
      <ul className={styles.list} aria-label="Misiones sugeridas originalmente">
        {snapshot.proposed_challenges.map((challenge, index) => {
          const related = linkFor(plan, challenge)
          return <li className={styles.mission} key={`${challenge.title}-${index}`}>
            <p className="eyebrow">SUGERENCIA {index + 1} · {targetLabels[challenge.target_type]}</p>
            <h4>{challenge.title}</h4>
            <p><strong>Objetivo:</strong> {challenge.objective}</p>
            <p>{challenge.explanation}</p>
            <p><strong>Condición para completarla:</strong> {challenge.measurable_condition}</p>
            {challenge.evidence.length > 0 && <><h5>En qué se basa</h5><ul>{challenge.evidence.map((evidence, evidenceIndex) => <li key={evidenceIndex}>{evidence}</li>)}</ul></>}
            {related && <p><strong>Recurso relacionado:</strong> <Link to={related.href}>{related.text}</Link></p>}
            {(challenge.start_date || challenge.end_date) && <p><strong>Periodo sugerido:</strong> {challenge.start_date ? dateLabel(challenge.start_date) : 'Sin inicio'} – {challenge.end_date ? dateLabel(challenge.end_date) : 'Sin fecha límite'}</p>}
          </li>
        })}
      </ul>}
    <p className={styles.muted}>La propuesta original se conserva para que puedas compararla con tus decisiones. Las misiones del plan se gestionan por separado.</p>
  </section>
}
