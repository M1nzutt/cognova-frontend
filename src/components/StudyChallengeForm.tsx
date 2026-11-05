import { useState } from 'react'
import type { FormEvent } from 'react'
import type { StudyChallenge, StudyChallengeWrite, StudyPlan, ChallengeTarget } from '../types/studyPlan'
import { challengeTargets } from '../types/studyPlan'
import { targetLabels } from '../utils/studyPlanPresentation'
import { localDateTime } from '../utils/studySessionPresentation'
import styles from './StudyPlans.module.css'

interface Props {
  plan: StudyPlan
  initial?: StudyChallenge
  busy: boolean
  error: string
  onSave: (value: StudyChallengeWrite) => void
  onCancel: () => void
}
const localInput = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
const initialNumber = (value: unknown, fallback: number) => typeof value === 'number' ? value : fallback
const initialText = (value: unknown) => typeof value === 'string' ? value : ''

export function StudyChallengeForm({ plan, initial, busy, error, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [target, setTarget] = useState<ChallengeTarget>(initial?.target_type ?? 'study_minutes')
  const [minutes, setMinutes] = useState(initialNumber(initial?.target_value.minutes, 30))
  const [criterion, setCriterion] = useState(initialText(initial?.target_value.criterion))
  const [threshold, setThreshold] = useState(initialNumber(initial?.target_value.threshold, 70))
  const [evidence, setEvidence] = useState(initialText(initial?.target_value.evidence))
  const [subjectId, setSubjectId] = useState<number | null>(initial?.subject_id ?? null)
  const [activityId, setActivityId] = useState<number | null>(initial?.activity_id ?? null)
  const [sessionId, setSessionId] = useState<number | null>(initial?.study_session_id ?? null)
  const [start, setStart] = useState(localInput(initial?.start_at))
  const [deadline, setDeadline] = useState(localInput(initial?.deadline))
  const [dependencies, setDependencies] = useState<number[]>(
    Array.isArray(initial?.generation_criteria.depends_on_activity_ids)
      ? initial.generation_criteria.depends_on_activity_ids.filter((id): id is number => typeof id === 'number')
      : [],
  )
  const [validation, setValidation] = useState('')
  const activities = plan.activities.filter(activity => activity.subject_id === subjectId)
  const sessions = plan.study_sessions.filter(session => session.subject_id === subjectId && (activityId === null || session.activity_id === activityId))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const startAt = start ? new Date(start) : null
    const deadlineAt = deadline ? new Date(deadline) : null
    if (!title.trim() || !description.trim()
      || startAt && !Number.isFinite(startAt.getTime())
      || deadlineAt && !Number.isFinite(deadlineAt.getTime())
      || startAt && deadlineAt && deadlineAt < startAt) {
      setValidation('Completa la misión y revisa sus fechas.')
      return
    }
    if ((target === 'study_minutes' && (subjectId === null && sessionId === null || minutes < 1 || minutes > 1440))
      || target === 'activity_completion' && activityId === null
      || target === 'session_completion' && sessionId === null
      || target === 'subject_mastery' && (subjectId === null || !criterion.trim() || threshold < 1 || threshold > 100)
      || target === 'custom' && !evidence.trim()) {
      setValidation('Elige un objetivo y su materia, actividad o sesión cuando corresponda.')
      return
    }
    const target_value: Record<string, unknown> = target === 'study_minutes' ? { minutes }
      : target === 'activity_completion' ? { status: 'completed' }
        : target === 'session_completion' ? { lifecycle: 'finished' }
          : target === 'subject_mastery' ? { criterion: criterion.trim(), threshold }
            : { evidence: evidence.trim() }
    const criteria = initial
      ? Object.fromEntries(Object.entries(initial.generation_criteria).filter(([key]) => key !== 'depends_on_activity_ids'))
      : { rationale: 'Misión definida por la persona' }
    setValidation('')
    onSave({
      subject_id: subjectId, activity_id: activityId, study_session_id: sessionId,
      title: title.trim(), description: description.trim(), target_type: target,
      target_value, start_at: startAt?.toISOString() ?? null, deadline: deadlineAt?.toISOString() ?? null,
      generation_criteria: criteria, depends_on_activity_ids: dependencies,
    })
  }

  return <form className={styles.form} onSubmit={submit}>
    <fieldset disabled={busy}>
      <legend>{initial ? 'Editar misión' : 'Nueva misión del plan'}</legend>
      <label htmlFor="mission-title">Nombre de la misión</label>
      <input id="mission-title" required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} />
      <label htmlFor="mission-description">¿Cómo vas a cumplirla?</label>
      <textarea id="mission-description" required maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} />
      <label htmlFor="mission-target">Objetivo</label>
      <select id="mission-target" value={target} onChange={event => setTarget(event.target.value as ChallengeTarget)}>
        {challengeTargets.map(value => <option key={value} value={value}>{targetLabels[value]}</option>)}
      </select>
      {target === 'study_minutes' && <><label htmlFor="mission-minutes">Minutos de estudio</label><input id="mission-minutes" type="number" min={1} max={1440} required value={minutes} onChange={event => setMinutes(Number(event.target.value))} /></>}
      {target === 'subject_mastery' && <><label htmlFor="mission-criterion">Qué quieres aprender</label><input id="mission-criterion" maxLength={200} required value={criterion} onChange={event => setCriterion(event.target.value)} /><label htmlFor="mission-threshold">Meta de avance (%)</label><input id="mission-threshold" type="number" min={1} max={100} required value={threshold} onChange={event => setThreshold(Number(event.target.value))} /></>}
      {target === 'custom' && <><label htmlFor="mission-evidence">Resultado esperado</label><input id="mission-evidence" required maxLength={500} value={evidence} onChange={event => setEvidence(event.target.value)} /></>}
      <label htmlFor="mission-subject">Materia relacionada</label>
      <select id="mission-subject" value={subjectId ?? ''} onChange={event => { setSubjectId(event.target.value ? Number(event.target.value) : null); setActivityId(null); setSessionId(null); setDependencies([]) }}>
        <option value="">Sin materia</option>{plan.subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
      </select>
      <label htmlFor="mission-activity">Actividad relacionada</label>
      <select id="mission-activity" value={activityId ?? ''} disabled={subjectId === null} onChange={event => { setActivityId(event.target.value ? Number(event.target.value) : null); setSessionId(null); setDependencies([]) }}>
        <option value="">Sin actividad</option>{activities.map(activity => <option key={activity.id} value={activity.id}>{activity.title}</option>)}
      </select>
      <label htmlFor="mission-session">Sesión relacionada</label>
      <select id="mission-session" value={sessionId ?? ''} disabled={subjectId === null} onChange={event => setSessionId(event.target.value ? Number(event.target.value) : null)}>
        <option value="">Sin sesión</option>{sessions.map(session => <option key={session.id} value={session.id}>{localDateTime(session.planned_start_at)} · {session.planned_duration} min</option>)}
      </select>
      {activityId !== null && <div><h3>Actividades que conviene terminar antes</h3>
        <div className={styles.choiceGrid}>{plan.activities.filter(activity => activity.id !== activityId).map(activity => <label className={styles.choice} key={activity.id}>
          <input type="checkbox" checked={dependencies.includes(activity.id)} onChange={event => setDependencies(current => event.target.checked ? [...current, activity.id] : current.filter(id => id !== activity.id))} />
          <span>{activity.title}</span>
        </label>)}</div></div>}
      <label htmlFor="mission-start">Inicio opcional</label>
      <input id="mission-start" type="datetime-local" value={start} onChange={event => setStart(event.target.value)} />
      <label htmlFor="mission-deadline">Fecha límite opcional</label>
      <input id="mission-deadline" type="datetime-local" value={deadline} onChange={event => setDeadline(event.target.value)} />
    </fieldset>
    {(validation || error) && <p role="alert" className={styles.error}>{validation || error}</p>}
    <div className={styles.actions}>
      <button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Guardando…' : initial ? 'Guardar misión' : 'Añadir misión'}</button>
      <button className="button" type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
    </div>
  </form>
}
