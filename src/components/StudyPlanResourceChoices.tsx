import { Link } from 'react-router-dom'
import type { Activity } from '../types/activity'
import type { Subject } from '../types/subject'
import type { StudySessionSummary } from '../types/studySession'
import { localDateTime } from '../utils/studySessionPresentation'
import styles from './StudyPlans.module.css'

export interface PlanSelection {
  subject_ids: number[]
  activity_ids: number[]
  study_session_ids: number[]
}

interface Props {
  subjects: Subject[]
  activities: Activity[]
  sessions: StudySessionSummary[]
  value: PlanSelection
  onChange: (value: PlanSelection) => void
}

export function StudyPlanResourceChoices({ subjects, activities, sessions, value, onChange }: Props) {
  const selectedSubjects = new Set(value.subject_ids)
  const selectedActivities = new Set(value.activity_ids)
  const visibleActivities = activities.filter(activity => selectedSubjects.has(activity.subject_id))
  const visibleSessions = sessions.filter(session => selectedSubjects.has(session.subject_id)
    && (session.activity_id === null || selectedActivities.has(session.activity_id)))

  function toggleSubject(id: number, checked: boolean) {
    const next = checked ? [...value.subject_ids, id] : value.subject_ids.filter(item => item !== id)
    const allowed = new Set(next)
    const activityIds = value.activity_ids.filter(item => activities.some(activity => activity.id === item && allowed.has(activity.subject_id)))
    onChange({
      subject_ids: next,
      activity_ids: activityIds,
      study_session_ids: value.study_session_ids.filter(item => sessions.some(session => session.id === item && allowed.has(session.subject_id)
        && (session.activity_id === null || activityIds.includes(session.activity_id)))),
    })
  }

  function toggleActivity(id: number, checked: boolean) {
    const next = checked ? [...value.activity_ids, id] : value.activity_ids.filter(item => item !== id)
    onChange({
      ...value,
      activity_ids: next,
      study_session_ids: value.study_session_ids.filter(item => sessions.some(session => session.id === item
        && (session.activity_id === null || next.includes(session.activity_id)))),
    })
  }

  function toggleSession(id: number, checked: boolean) {
    onChange({ ...value, study_session_ids: checked ? [...value.study_session_ids, id] : value.study_session_ids.filter(item => item !== id) })
  }

  return <fieldset>
    <legend>Vincular lo que ya estudias</legend>
    <p className={styles.muted}>El plan reúne recursos existentes; no cambia tus materias, actividades ni sesiones.</p>
    <h3>Materias</h3>
    {subjects.length === 0 && <p>Primero <Link to="/app/subjects/new">crea una materia</Link> si quieres relacionarla con este plan.</p>}
    <div className={styles.choiceGrid}>{subjects.map(subject => <label className={styles.choice} key={subject.id}>
      <input type="checkbox" checked={selectedSubjects.has(subject.id)} onChange={event => toggleSubject(subject.id, event.target.checked)} />
      <span>{subject.name}{subject.status === 'archived' ? ' · archivada' : ''}</span>
    </label>)}</div>
    <h3>Actividades</h3>
    {visibleActivities.length === 0 && <p className={styles.muted}>Selecciona una materia para ver sus actividades.</p>}
    <div className={styles.choiceGrid}>{visibleActivities.map(activity => <label className={styles.choice} key={activity.id}>
      <input type="checkbox" checked={selectedActivities.has(activity.id)} onChange={event => toggleActivity(activity.id, event.target.checked)} />
      <span>{activity.title}</span>
    </label>)}</div>
    <h3>Sesiones</h3>
    {visibleSessions.length === 0 && <p className={styles.muted}>Selecciona la materia y, si corresponde, su actividad para ver las sesiones.</p>}
    <div className={styles.choiceGrid}>{visibleSessions.map(session => <label className={styles.choice} key={session.id}>
      <input type="checkbox" checked={value.study_session_ids.includes(session.id)} onChange={event => toggleSession(session.id, event.target.checked)} />
      <span>{localDateTime(session.planned_start_at)} · {session.planned_duration} min</span>
    </label>)}</div>
  </fieldset>
}
