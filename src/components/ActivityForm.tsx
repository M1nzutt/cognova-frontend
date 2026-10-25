import { useState } from 'react'
import type { Activity, ActivityPriority, ActivityStatus, ActivityWrite } from '../types/activity'
import type { Subject } from '../types/subject'
import { priorityLabels, statusLabels, toInstant, localZone } from '../utils/activityPresentation'
import styles from './Activities.module.css'
interface Props { subjects: Subject[]; initial?: Activity; busy: boolean; error: string; onSave: (body: ActivityWrite) => void; onCancel: () => void }
export function ActivityForm({ subjects, initial, busy, error, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? ''), [subject, setSubject] = useState(initial?.subject_id ?? subjects[0]?.id ?? 0)
  const [priority, setPriority] = useState<ActivityPriority>(initial?.priority ?? 'medium'), [status, setStatus] = useState<ActivityStatus>('pending')
  const [duration, setDuration] = useState(String(initial?.estimated_duration ?? 30)), [notes, setNotes] = useState(initial?.notes ?? ''), [date, setDate] = useState(''), [validation, setValidation] = useState('')
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || [...title.trim()].length > 50) { setValidation('Escribe un título de entre 1 y 50 caracteres.'); return }
    if (!subjects.some(s => s.id === subject)) { setValidation('Selecciona una de tus materias.'); return }
    if (!Number.isInteger(Number(duration)) || Number(duration) < 10 || Number(duration) > 300) { setValidation('La duración debe estar entre 10 y 300 minutos.'); return }
    if ([...notes].length > 200) { setValidation('Las notas pueden tener hasta 200 caracteres.'); return }
    let deadline: string
    try { deadline = initial?.deadline ?? toInstant(date) } catch { setValidation('Selecciona una fecha y hora válidas.'); return }
    setValidation(''); onSave({ title: title.trim(), subject_id: subject, priority, status: initial?.status ?? status, estimated_duration: Number(duration), notes: notes.trim() || null, deadline })
  }
  return <form className={styles.form} aria-label={initial ? 'Editar actividad' : 'Crear actividad'} onSubmit={submit}>
    <fieldset disabled={busy}><label htmlFor="activity-title">Título</label><input id="activity-title" value={title} onChange={e => setTitle(e.target.value)} required aria-describedby="activity-title-hint" />
      <small id="activity-title-hint">Máximo 50 caracteres · {[...title.trim()].length}/50</small>
      <label htmlFor="activity-subject">Materia</label><select id="activity-subject" value={subject} onChange={e => setSubject(Number(e.target.value))} required><option value={0} disabled>Selecciona una materia</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.status === 'archived' ? ' (archivada)' : ''}</option>)}</select>
      {!initial && <><label htmlFor="activity-deadline">Fecha límite</label><input id="activity-deadline" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required /><small>Hora local: {localZone()}.</small><label htmlFor="activity-status">Estado inicial</label><select id="activity-status" value={status} onChange={e => setStatus(e.target.value as ActivityStatus)}>{Object.entries(statusLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></>}
      <div className={styles.columns}><div><label htmlFor="activity-priority">Prioridad</label><select id="activity-priority" value={priority} onChange={e => setPriority(e.target.value as ActivityPriority)}>{Object.entries(priorityLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div><div><label htmlFor="activity-duration">Duración estimada (min)</label><input id="activity-duration" type="number" min={10} max={300} step={1} value={duration} onChange={e => setDuration(e.target.value)} required /></div></div>
      <label htmlFor="activity-notes">Notas (opcional)</label><textarea id="activity-notes" value={notes} onChange={e => setNotes(e.target.value)} aria-describedby="notes-hint" /><small id="notes-hint">Máximo 200 caracteres · {[...notes].length}/200</small>
      {initial && <p>El estado y la fecha límite se cambian desde sus controles en el detalle.</p>}
    </fieldset>
    {(validation || error) && <p role="alert" className={styles.error}>{validation || error}</p>}
    <div className="actions"><button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear actividad'}</button><button className="button" type="button" disabled={busy} onClick={onCancel}>Cancelar</button></div>
  </form>
}
