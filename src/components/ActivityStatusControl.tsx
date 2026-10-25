import { useState } from 'react'
import type { Activity, ActivityStatus } from '../types/activity'
import { allowedStatus, statusLabels } from '../utils/activityPresentation'
import styles from './Activities.module.css'
export function ActivityStatusControl({ item, busy, onSave }: { item: Activity; busy: boolean; onSave: (value: ActivityStatus) => void }) {
  const [value, setValue] = useState<ActivityStatus>(item.status)
  return <section className={styles.controls}><h2>Cambiar estado</h2><p>Estado actual: {statusLabels[item.status]}. Cambiarlo no modifica la fecha límite.</p>
    {['completed', 'cancelled'].includes(item.status) && <p>Para continuar trabajando en esta actividad, reábrela como Pendiente.</p>}
    <form className={styles.form} onSubmit={e => { e.preventDefault(); if (allowedStatus(item.status, value)) onSave(value) }}><fieldset disabled={busy}><label htmlFor="new-status">Nuevo estado</label><select id="new-status" value={value} onChange={e => setValue(e.target.value as ActivityStatus)}>{Object.entries(statusLabels).map(([v,l]) => <option key={v} value={v} disabled={!allowedStatus(item.status, v as ActivityStatus)}>{l}</option>)}</select></fieldset><button className="button" disabled={busy || value === item.status || !allowedStatus(item.status, value)}>Guardar estado</button></form>
  </section>
}
