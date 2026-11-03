import { useState } from 'react'
import type { FormEvent } from 'react'
import type { SessionExecutionState, SessionResult, StudySessionFilters } from '../types/studySession'
import type { Subject } from '../types/subject'
import { executionStateLabels, sessionResultLabels } from '../utils/studySessionPresentation'
import { toInstant } from '../utils/activityPresentation'
import styles from './StudySessions.module.css'

export function StudySessionFilters({ subjects, onApply, onClear }: { subjects: Subject[]; onApply: (filters: StudySessionFilters) => void; onClear: () => void }) {
  const [subject, setSubject] = useState('')
  const [state, setState] = useState<SessionExecutionState | ''>('')
  const [result, setResult] = useState<SessionResult | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')
  function apply(event: FormEvent) {
    event.preventDefault()
    let planned_start_from: string | undefined, planned_start_to: string | undefined
    try {
      planned_start_from = from ? toInstant(from) : undefined
      planned_start_to = to ? toInstant(to) : undefined
    } catch { setError('Indica fechas y horas válidas.'); return }
    if (planned_start_from && planned_start_to && Date.parse(planned_start_from) > Date.parse(planned_start_to)) { setError('La fecha inicial debe ser anterior a la final.'); return }
    setError('')
    onApply({ ...(subject ? { subject_id: Number(subject) } : {}), ...(state ? { execution_state: state } : {}), ...(result ? { status: result } : {}), ...(planned_start_from ? { planned_start_from } : {}), ...(planned_start_to ? { planned_start_to } : {}) })
  }
  function clear() { setSubject(''); setState(''); setResult(''); setFrom(''); setTo(''); setError(''); onClear() }
  return <form className={styles.filters} aria-label="Filtros de sesiones" onSubmit={apply}>
    <label>Materia<select aria-label="Filtrar sesiones por materia" value={subject} onChange={event => setSubject(event.target.value)}><option value="">Todas</option>{subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Ciclo<select aria-label="Filtrar sesiones por ciclo" value={state} onChange={event => setState(event.target.value as SessionExecutionState | '')}><option value="">Todos</option>{Object.entries(executionStateLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Resultado<select aria-label="Filtrar sesiones por resultado" value={result} onChange={event => setResult(event.target.value as SessionResult | '')}><option value="">Todos</option>{Object.entries(sessionResultLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Planificada desde<input aria-label="Planificada desde" type="datetime-local" value={from} onChange={event => setFrom(event.target.value)} /></label>
    <label>Planificada hasta<input aria-label="Planificada hasta" type="datetime-local" value={to} onChange={event => setTo(event.target.value)} /></label>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.actions}><button className="button" type="submit">Aplicar filtros</button><button className="button" type="button" onClick={clear}>Limpiar filtros</button></div>
  </form>
}
