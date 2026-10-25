import { useState } from 'react'
import type { ActivityFilters as Filters, ActivityPriority, ActivityStatus } from '../types/activity'
import type { Subject } from '../types/subject'
import { localZone, priorityLabels, statusLabels, toInstant } from '../utils/activityPresentation'
import styles from './Activities.module.css'
export function ActivityFilters({ subjects, onApply }: { subjects: Subject[]; onApply: (v: Filters) => void }) {
  const [subject, setSubject] = useState(''), [status, setStatus] = useState(''), [priority, setPriority] = useState(''), [mode, setMode] = useState('range'), [from, setFrom] = useState(''), [to, setTo] = useState(''), [exact, setExact] = useState(''), [error, setError] = useState('')
  function apply(e: React.FormEvent) {
    e.preventDefault()
    try { const f: Filters = {}; if (subject) f.subject_id = Number(subject); if (status) f.status = status as ActivityStatus; if (priority) f.priority = priority as ActivityPriority
      if (mode === 'exact' && exact) f.deadline = toInstant(exact)
      if (mode === 'range') { if (from) f.deadline_from = toInstant(from); if (to) f.deadline_to = toInstant(to); if (f.deadline_from && f.deadline_to && f.deadline_from > f.deadline_to) throw new Error() }
      setError(''); onApply(f)
    } catch { setError('Revisa las fechas: el inicio no puede ser posterior al final.') }
  }
  return <section className={styles.filters} aria-label="Filtros de actividades"><h2>Filtrar actividades</h2><form className={styles.form} onSubmit={apply}><fieldset>
    <div className={styles.columns}><div><label htmlFor="filter-subject">Filtrar por materia</label><select id="filter-subject" value={subject} onChange={e => setSubject(e.target.value)}><option value="">Todas las materias</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.status === 'archived' ? ' (archivada)' : ''}</option>)}</select></div>
    <div><label htmlFor="filter-status">Filtrar por estado</label><select id="filter-status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div></div>
    <div className={styles.columns}><div><label htmlFor="filter-priority">Filtrar por prioridad</label><select id="filter-priority" value={priority} onChange={e => setPriority(e.target.value)}><option value="">Todas las prioridades</option>{Object.entries(priorityLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div><div><label htmlFor="filter-mode">Fecha límite</label><select id="filter-mode" value={mode} onChange={e => setMode(e.target.value)}><option value="range">Intervalo</option><option value="exact">Fecha y hora exactas</option></select></div></div>
    {mode === 'exact' ? <><label htmlFor="filter-exact">Fecha y hora</label><input id="filter-exact" type="datetime-local" value={exact} onChange={e => setExact(e.target.value)} /></> : <div className={styles.columns}><div><label htmlFor="filter-from">Desde</label><input id="filter-from" type="datetime-local" value={from} onChange={e => setFrom(e.target.value)} /></div><div><label htmlFor="filter-to">Hasta (incluido)</label><input id="filter-to" type="datetime-local" value={to} onChange={e => setTo(e.target.value)} /></div></div>}
    <small>Fechas en tu hora local: {localZone()}.</small></fieldset>{error && <p role="alert" className={styles.error}>{error}</p>}
    <div className="actions"><button className="button" type="submit">Aplicar filtros</button><button className="button" type="button" onClick={() => { setSubject(''); setStatus(''); setPriority(''); setFrom(''); setTo(''); setExact(''); setError(''); onApply({}) }}>Limpiar filtros</button></div>
  </form></section>
}
