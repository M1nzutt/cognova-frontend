import { useCallback, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useActivityServices } from '../hooks/useActivityServices'
import { useActivityResource } from '../hooks/useActivityResource'
import { useActivityMutation } from '../hooks/useActivityMutation'
import { ActivityForm } from '../components/ActivityForm'
import { ActivityStatusControl } from '../components/ActivityStatusControl'
import { ActivityDeadlineControl } from '../components/ActivityDeadlineControl'
import { ActivityDeadlineHistory } from '../components/ActivityDeadlineHistory'
import { ActivityDeleteConfirmation } from '../components/ActivityDeleteConfirmation'
import { dateLabel, localZone, priorityLabels, statusLabels } from '../utils/activityPresentation'
import type { Activity } from '../types/activity'
import styles from '../components/Activities.module.css'
export function ActivityDetailPage() { const { activityId } = useParams(); return <ActivityDetail key={activityId} id={Number(activityId)} /> }
function ActivityDetail({ id }: { id: number }) {
  const { service, loadSubjects } = useActivityServices()
  const load = useCallback(async (signal: AbortSignal) => { const [item, subjects] = await Promise.all([service.detail(id, signal), loadSubjects(signal)]); return { item, subjects } }, [service, loadSubjects, id])
  const resource = useActivityResource(load), mutation = useActivityMutation(), navigate = useNavigate(), location = useLocation()
  const [editing, setEditing] = useState(false), [deleting, setDeleting] = useState(false), [notice, setNotice] = useState(location.state?.activityCreated ? 'Actividad creada.' : '')
  const trigger = useRef<HTMLButtonElement>(null), item = resource.data?.item
  function updated(value: Activity, message: string) { resource.setData(old => old ? { ...old, item: value } : old); setNotice(message) }
  function closeDelete() { setDeleting(false); mutation.clearError(); trigger.current?.focus() }
  return <section className={styles.page}><Link to="/app/activities">← Actividades</Link>
    {resource.loading && <p role="status">Cargando actividad…</p>}{resource.error && <div role="alert"><h1>No pudimos abrir la actividad</h1><p>{resource.error}</p><button className="button" onClick={resource.retry}>Reintentar</button></div>}
    {item && resource.data && !resource.loading && <><div className={styles.heading}><h1>{editing ? 'Editar actividad' : item.title}</h1><span className={styles.badge}>{statusLabels[item.status]}</span></div>
      {notice && <p role="status">{notice}</p>}
      {mutation.error && !deleting && <div><p role="alert" className={styles.error}>{mutation.error}</p><button className="button" disabled={mutation.busy} onClick={() => void mutation.run(signal => service.detail(id, signal), v => updated(v, 'Versión actual consultada. Revisa tu borrador antes de volver a guardar.'))}>Consultar versión actual</button></div>}
      {editing ? <ActivityForm initial={item} subjects={resource.data.subjects} busy={mutation.busy} error="" onCancel={() => { setEditing(false); mutation.clearError() }} onSave={body => void mutation.run(signal => service.update(id, body, signal), v => { updated(v, 'Cambios guardados.'); setEditing(false) })} /> : <>
        <div className={styles.detail}><dl><dt>Materia</dt><dd>{resource.data.subjects.find(s => s.id === item.subject_id)?.name ?? 'Materia no disponible'}</dd><dt>Prioridad</dt><dd>{priorityLabels[item.priority]}</dd><dt>Duración</dt><dd>{item.estimated_duration} minutos</dd><dt>Fecha límite</dt><dd><time dateTime={item.deadline}>{dateLabel(item.deadline)}</time></dd><dt>Fecha original</dt><dd><time dateTime={item.original_deadline}>{dateLabel(item.original_deadline)}</time></dd></dl><p>Hora local: {localZone()}.</p><h2>Notas</h2><p className={styles.notes}>{item.notes || 'Sin notas.'}</p></div>
        <button className={styles.primary} disabled={mutation.busy} onClick={() => { setEditing(true); setNotice(''); mutation.clearError() }}>Editar actividad</button>
        <ActivityStatusControl item={item} busy={mutation.busy} onSave={status => void mutation.run(signal => service.status(id, status, item.status, signal), v => updated(v, 'Estado actualizado.'))} />
        <ActivityDeadlineControl item={item} busy={mutation.busy} onSave={date => void mutation.run(signal => service.deadline(id, date, item.deadline_revision, signal), v => updated(v, 'Fecha límite actualizada.'))} />
        <ActivityDeadlineHistory key={item.deadline_revision} service={service} id={id} />
        <section className={styles.dangerZone}><h2>Eliminar actividad</h2><p>La eliminación es permanente. Las actividades con historial o registros relacionados se conservan.</p><button ref={trigger} className={styles.danger} disabled={mutation.busy} onClick={() => { mutation.clearError(); setDeleting(true) }}>Eliminar actividad</button></section>
      </>}
      {deleting && <ActivityDeleteConfirmation name={item.title} busy={mutation.busy} error={mutation.error} onCancel={closeDelete} onConfirm={() => void mutation.run(signal => service.remove(id, true, signal), () => navigate('/app/activities', { replace: true, state: { activityDeleted: true } }))} />}
    </>}
  </section>
}
