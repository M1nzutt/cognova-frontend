import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Activity } from '../types/activity'
import type { Subject } from '../types/subject'
import type { StudySessionSummary } from '../types/studySession'
import type { StudyPlan, StudyPlanWrite } from '../types/studyPlan'
import { StudyPlanResourceChoices } from './StudyPlanResourceChoices'
import type { PlanSelection } from './StudyPlanResourceChoices'
import styles from './StudyPlans.module.css'

interface Props {
  subjects: Subject[]
  activities: Activity[]
  sessions: StudySessionSummary[]
  initial?: StudyPlan
  busy: boolean
  error: string
  onSave: (value: StudyPlanWrite) => void
  onCancel: () => void
}

const localInput = (value: string | Date): string => {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function StudyPlanForm({ subjects, activities, sessions, initial, busy, error, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [objective, setObjective] = useState(initial?.objective ?? '')
  const [start, setStart] = useState(localInput(initial?.start_at ?? new Date()))
  const [end, setEnd] = useState(localInput(initial?.end_at ?? new Date(Date.now() + 7 * 86_400_000)))
  const [selection, setSelection] = useState<PlanSelection>({
    subject_ids: initial?.subjects.map(item => item.id) ?? [],
    activity_ids: initial?.activities.map(item => item.id) ?? [],
    study_session_ids: initial?.study_sessions.map(item => item.id) ?? [],
  })
  const [validation, setValidation] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const startAt = new Date(start), endAt = new Date(end)
    if (!name.trim() || !objective.trim() || !Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
      setValidation('Escribe un nombre y objetivo, y elige un fin posterior al inicio.')
      return
    }
    if (selection.study_session_ids.some(id => {
      const session = sessions.find(item => item.id === id)
      return !session || Date.parse(session.planned_start_at) < startAt.getTime()
        || Date.parse(session.planned_start_at) + session.planned_duration * 60_000 > endAt.getTime()
    })) {
      setValidation('Las sesiones vinculadas deben caber entre el inicio y el fin del plan.')
      return
    }
    setValidation('')
    onSave({
      name: name.trim(), objective: objective.trim(), start_at: startAt.toISOString(),
      end_at: endAt.toISOString(), ...selection,
    })
  }

  return <form className={styles.form} onSubmit={submit}>
    <fieldset disabled={busy}>
      <legend>Tu plan</legend>
      <label htmlFor="plan-name">Nombre del plan</label>
      <input id="plan-name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} />
      <label htmlFor="plan-objective">¿Qué quieres lograr?</label>
      <textarea id="plan-objective" required maxLength={2000} value={objective} onChange={event => setObjective(event.target.value)} />
      <label htmlFor="plan-start">Inicio</label>
      <input id="plan-start" type="datetime-local" required value={start} onChange={event => setStart(event.target.value)} />
      <label htmlFor="plan-end">Fin</label>
      <input id="plan-end" type="datetime-local" required value={end} onChange={event => setEnd(event.target.value)} />
    </fieldset>
    <StudyPlanResourceChoices subjects={subjects} activities={activities} sessions={sessions} value={selection} disabled={busy} onChange={setSelection} />
    {(validation || error) && <p className={styles.error} role="alert">{validation || error}</p>}
    <div className={styles.actions}>
      <button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear plan'}</button>
      <button className="button" type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
    </div>
  </form>
}
