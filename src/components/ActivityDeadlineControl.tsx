import { useState } from 'react'
import type { Activity } from '../types/activity'
import { localDate, localZone, toInstant } from '../utils/activityPresentation'
import styles from './Activities.module.css'
export function ActivityDeadlineControl({ item, busy, onSave }: { item: Activity; busy: boolean; onSave: (value: string) => void }) {
  const [date, setDate] = useState(localDate(item.deadline)), [error, setError] = useState('')
  const delta = Date.parse(date) - Date.parse(item.deadline)
  return <section className={styles.controls}><h2>Cambiar fecha límite</h2><p>Cada cambio se conserva en el historial. El estado de la actividad se mantiene.</p><form className={styles.form} onSubmit={e => { e.preventDefault(); try { const v = toInstant(date); setError(''); onSave(v) } catch { setError('Selecciona una fecha y hora válidas.') } }}>
    <fieldset disabled={busy}><label htmlFor="new-deadline">Nueva fecha límite</label><input id="new-deadline" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required /><small>Hora local: {localZone()}.</small></fieldset>
    {Number.isFinite(delta) && delta !== 0 && <p>{delta > 0 ? 'La fecha se postergará.' : 'La fecha se adelantará.'} La fecha original se conservará.</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}<button className="button" disabled={busy || delta === 0}>Guardar fecha límite</button>
  </form></section>
}
