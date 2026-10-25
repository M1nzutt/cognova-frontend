import { useCallback } from 'react'
import type { ActivityService } from '../services/ActivityService'
import { useActivityResource } from '../hooks/useActivityResource'
import { useActivityMutation } from '../hooks/useActivityMutation'
import { dateLabel } from '../utils/activityPresentation'
import styles from './Activities.module.css'
export function ActivityDeadlineHistory({ service, id }: { service: ActivityService; id: number }) {
  const load = useCallback((signal: AbortSignal) => service.history(id, undefined, signal), [service, id])
  const { data, setData, loading, error, retry } = useActivityResource(load), more = useActivityMutation()
  return <section className={styles.controls} aria-labelledby="history-title"><h2 id="history-title">Historial de fechas</h2>
    {loading && <p role="status">Cargando historial…</p>}{error && <div role="alert"><p>{error}</p><button className="button" onClick={retry}>Reintentar historial</button></div>}
    {data && !loading && <>{!data.items.length ? <p>Aún no has cambiado la fecha límite.</p> : <ol className={styles.history}>{data.items.map(event => <li key={event.revision}><strong>{event.event_type === 'postponed' ? 'Fecha postergada' : 'Fecha adelantada'}</strong><p>De <time dateTime={event.previous_deadline}>{dateLabel(event.previous_deadline)}</time> a <time dateTime={event.new_deadline}>{dateLabel(event.new_deadline)}</time>.</p><small>Registrado el {dateLabel(event.occurred_at)}.</small></li>)}</ol>}
    {data.next_after_revision !== null && <button className="button" disabled={more.busy} onClick={() => void more.run(signal => service.history(id, data.next_after_revision ?? undefined, signal), page => setData(previous => previous ? { ...page, items: [...previous.items, ...page.items.filter(e => !previous.items.some(old => old.revision === e.revision))] } : page))}>{more.busy ? 'Cargando…' : 'Cargar más cambios'}</button>}{more.error && <p role="alert" className={styles.error}>{more.error}</p>}</>}
  </section>
}
