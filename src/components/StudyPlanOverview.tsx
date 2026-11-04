import { Link } from 'react-router-dom'
import type { PlanBranch, StudyPlan } from '../types/studyPlan'
import { decisionText, planStatusLabels, sourceLabels } from '../utils/studyPlanPresentation'
import { localDateTime } from '../utils/studySessionPresentation'
import styles from './StudyPlans.module.css'

const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function branchLink(branch: PlanBranch) {
  const id = Number(branch.key.split(':')[1])
  if (!Number.isSafeInteger(id) || id < 1) return branch.label
  const route = branch.kind === 'subject' ? `/app/subjects/${id}`
    : branch.kind === 'activity' ? `/app/activities/${id}`
      : branch.kind === 'study_session' ? `/app/sessions/${id}`
        : branch.kind === 'challenge' ? `#mission-${id}` : null
  return route ? <Link to={route}>{branch.label}</Link> : branch.label
}

function PlanTree({ branch }: { branch: PlanBranch }) {
  return <li>{branchLink(branch)}
    {branch.children.length > 0 && <ul className={styles.hierarchy}>{branch.children.map(child => <PlanTree branch={child} key={child.key} />)}</ul>}
  </li>
}

export function StudyPlanOverview({ plan }: { plan: StudyPlan }) {
  const activityName = (id: number) => plan.activities.find(item => item.id === id)?.title ?? 'Actividad vinculada'
  return <div className={styles.sections}>
    <section className={styles.panel} aria-labelledby="plan-about">
      <h2 id="plan-about">Tu objetivo</h2>
      <p>{plan.objective}</p>
      <dl className={styles.summary}>
        <dt>Estado</dt><dd>{planStatusLabels[plan.status]}</dd>
        <dt>Origen</dt><dd>{sourceLabels[plan.source]}</dd>
        <dt>Inicio</dt><dd><time dateTime={plan.start_at}>{localDateTime(plan.start_at)}</time></dd>
        <dt>Fin</dt><dd><time dateTime={plan.end_at}>{localDateTime(plan.end_at)}</time></dd>
      </dl>
    </section>
    <section className={styles.panel} aria-labelledby="plan-map">
      <h2 id="plan-map">Cómo se conecta tu plan</h2>
      <p className={styles.muted}>Abre cada recurso para ver o cambiar sus propios detalles.</p>
      <ul className={styles.hierarchy}><PlanTree branch={plan.hierarchy} /></ul>
    </section>
    <section className={styles.panel} aria-labelledby="plan-next">
      <h2 id="plan-next">En qué enfocarte</h2>
      {plan.priority_order.length === 0 ? <p>No hay actividades vinculadas todavía.</p>
        : <><h3>Por prioridad</h3><ol className={styles.resourceList}>{plan.priority_order.map(id => <li key={id}><Link to={`/app/activities/${id}`}>{activityName(id)}</Link></li>)}</ol>
          <h3>Orden para avanzar</h3><ol className={styles.resourceList}>{plan.activity_dependency_order.map(id => <li key={id}><Link to={`/app/activities/${id}`}>{activityName(id)}</Link></li>)}</ol></>}
    </section>
    <section className={styles.panel} aria-labelledby="plan-rhythm">
      <h2 id="plan-rhythm">Tu ritmo semanal</h2>
      <ul className={styles.rhythm}>{plan.weekly_rhythm.map(day => <li key={day.weekday}><span>{weekdays[day.weekday]}</span><strong>{day.planned_minutes} min</strong></li>)}</ul>
      <h3>Espacios de 30 minutos</h3>
      {plan.schedule_conflict ? <p role="status">Hay sesiones superpuestas. Revisa sus horarios antes de usar estos espacios.</p>
        : plan.candidate_slots.length === 0 ? <p>No hay un espacio libre de 30 minutos dentro de este plan.</p>
          : <ul className={styles.resourceList}>{plan.candidate_slots.map(slot => <li key={slot.start_at}><time dateTime={slot.start_at}>{localDateTime(slot.start_at)}</time> · {slot.duration_minutes} min</li>)}</ul>}
      <p className={styles.muted}>Estos espacios solo consideran las sesiones vinculadas al plan.</p>
    </section>
    <section className={styles.panel} aria-labelledby="plan-decisions">
      <h2 id="plan-decisions">Decisiones sobre el plan</h2>
      {plan.decisions.length === 0 ? <p>Aún no hay cambios o decisiones guardadas.</p>
        : <ol className={styles.resourceList}>{plan.decisions.map(decision => <li key={decision.id}><time dateTime={decision.created_at}>{localDateTime(decision.created_at)}</time>: {decisionText(decision)}</li>)}</ol>}
    </section>
  </div>
}
