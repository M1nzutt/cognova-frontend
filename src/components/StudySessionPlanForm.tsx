import { useEffect, useState } from 'react'
import type { Activity } from '../types/activity'
import type { StudySession, StudySessionWrite } from '../types/studySession'
import type { Subject } from '../types/subject'
import { localDate, toInstant } from '../utils/activityPresentation'
import { localZone } from '../utils/activityPresentation'
import styles from './StudySessions.module.css'

interface Props {
  subjects: Subject[]
  activities: Activity[]
  activitiesLoading: boolean
  initial?: StudySession
  busy: boolean
  error: string
  onSubjectChange: (subjectId: number) => void
  onSave: (body: StudySessionWrite) => void
  onCancel: () => void
}

export function StudySessionPlanForm({ subjects, activities, activitiesLoading, initial, busy, error, onSubjectChange, onSave, onCancel }: Props) {
  const [subjectId, setSubjectId] = useState(initial?.subject_id ?? subjects.find(subject => subject.status === 'active')?.id ?? subjects[0]?.id ?? 0)
  const [activityId, setActivityId] = useState(initial?.activity_id ? String(initial.activity_id) : '')
  const [plannedStart, setPlannedStart] = useState(initial ? localDate(initial.planned_start_at) : '')
  const [duration, setDuration] = useState(String(initial?.planned_duration ?? 45))
  const [validation, setValidation] = useState('')

  useEffect(() => {
    if (!activitiesLoading && activityId && !activities.some(item => item.id === Number(activityId) && item.subject_id === subjectId)) setActivityId('')
  }, [activities, activitiesLoading, activityId, subjectId])

  useEffect(() => {
    if (!subjectId && subjects.length) {
      const preferred = subjects.find(subject => subject.status === 'active') ?? subjects[0]
      setSubjectId(preferred.id)
      onSubjectChange(preferred.id)
    }
  }, [onSubjectChange, subjectId, subjects])

  function changeSubject(value: number) {
    setSubjectId(value)
    setActivityId('')
    onSubjectChange(value)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!subjects.some(subject => subject.id === subjectId)) { setValidation('Selecciona una de tus materias.'); return }
    const minutes = Number(duration)
    if (!Number.isInteger(minutes) || minutes < 10 || minutes > 180) { setValidation('La duración debe estar entre 10 y 180 minutos.'); return }
    const activity = activityId ? activities.find(item => item.id === Number(activityId) && item.subject_id === subjectId) : null
    if (activityId && !activity) { setValidation('Selecciona una actividad de la materia elegida.'); return }
    let planned_start_at: string
    try { planned_start_at = toInstant(plannedStart) } catch { setValidation('Selecciona una fecha y hora local válidas.'); return }
    setValidation('')
    onSave({ subject_id: subjectId, activity_id: activity?.id ?? null, planned_start_at, planned_duration: minutes })
  }

  return <form className={styles.form} aria-label={initial ? 'Editar planificación de sesión' : 'Planificar sesión'} noValidate onSubmit={submit}>
    <fieldset disabled={busy}>
      <label htmlFor="session-subject">Materia</label>
      <select id="session-subject" value={subjectId} onChange={event => changeSubject(Number(event.target.value))} required>
        <option value={0} disabled>Selecciona una materia</option>
        {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}{subject.status === 'archived' ? ' (archivada)' : ''}</option>)}
      </select>
      <label htmlFor="session-activity">Actividad (opcional)</label>
      <select id="session-activity" value={activityId} onChange={event => setActivityId(event.target.value)} disabled={!subjectId || activitiesLoading}>
        <option value="">Sin actividad asociada</option>
        {activities.filter(activity => activity.subject_id === subjectId).map(activity => <option key={activity.id} value={activity.id}>{activity.title}</option>)}
      </select>
      {activitiesLoading && <small role="status">Cargando actividades de la materia…</small>}
      <label htmlFor="session-planned-start">Fecha y hora planificadas</label>
      <input id="session-planned-start" type="datetime-local" value={plannedStart} onChange={event => setPlannedStart(event.target.value)} required />
      <small>Hora local: {localZone()}. Esta fecha se conserva como planificación; el temporizador registra la ejecución real.</small>
      <label htmlFor="session-planned-duration">Duración planificada (minutos)</label>
      <input id="session-planned-duration" type="number" min={10} max={180} step={1} value={duration} onChange={event => setDuration(event.target.value)} required aria-describedby="session-duration-hint" />
      <small id="session-duration-hint">Entre 10 y 180 minutos.</small>
    </fieldset>
    {(validation || error) && <p role="alert" className={styles.error}>{validation || error}</p>}
    <div className={styles.actions}>
      <button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Guardando…' : initial ? 'Guardar planificación' : 'Crear sesión planificada'}</button>
      <button className="button" type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
    </div>
  </form>
}
