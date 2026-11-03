import { useCallback, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { StudySessionActions } from '../components/StudySessionActions'
import { StudySessionDeleteConfirmation } from '../components/StudySessionDeleteConfirmation'
import { StudySessionFinishDialog } from '../components/StudySessionFinishDialog'
import { StudySessionIntervals } from '../components/StudySessionIntervals'
import { StudySessionPlanForm } from '../components/StudySessionPlanForm'
import { StudySessionTimer } from '../components/StudySessionTimer'
import { useStudySessionMutation } from '../hooks/useStudySessionMutation'
import { useStudySessionPlanOptions } from '../hooks/useStudySessionPlanOptions'
import { useStudySessionResource } from '../hooks/useStudySessionResource'
import { useStudySessionServices } from '../hooks/useStudySessionServices'
import type { SessionResult, StudySession, StudySessionWrite } from '../types/studySession'
import { executionStateLabels, formatDuration, localDateTime, sessionContextLabels, sessionResultLabels } from '../utils/studySessionPresentation'
import styles from '../components/StudySessions.module.css'

export function StudySessionDetailPage() {
  const { sessionId } = useParams()
  return <StudySessionDetail key={sessionId} id={Number(sessionId)} />
}

function SessionEditPlan({ session, busy, error, onSave, onCancel }: {
  session: StudySession; busy: boolean; error: string; onSave: (value: StudySessionWrite) => void; onCancel: () => void
}) {
  const options = useStudySessionPlanOptions(session.subject_id)
  const selectSubject = options.selectSubject
  return <section>
    <h2>Editar planificación</h2>
    {options.loading && <p role="status">Cargando opciones de planificación…</p>}
    {options.error && <div role="alert"><p>{options.error}</p><button className="button" onClick={options.retry}>Reintentar</button></div>}
    {!options.loading && options.subjects.length > 0 && <StudySessionPlanForm initial={session} subjects={options.subjects} activities={options.activities} activitiesLoading={options.activitiesLoading} busy={busy} error={error || options.error} onSubjectChange={selectSubject} onSave={onSave} onCancel={onCancel} />}
  </section>
}

function StudySessionDetail({ id }: { id: number }) {
  const services = useStudySessionServices()
  const load = useCallback(async (signal: AbortSignal) => {
    const item = await services.sessions.detail(id, signal)
    const subjects = await services.loadSubjects(signal)
    const activities = item.activity_id ? await services.loadActivities(item.subject_id, signal) : []
    return { item, subjects, activities }
  }, [id, services])
  const resource = useStudySessionResource(load)
  const mutation = useStudySessionMutation()
  const [editing, setEditing] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const location = useLocation()
  const [notice, setNotice] = useState(location.state?.sessionCreated ? 'Sesión planificada.' : '')
  const navigate = useNavigate()
  const heading = useRef<HTMLHeadingElement>(null)
  const finishTrigger = useRef<HTMLButtonElement>(null)
  const deleteTrigger = useRef<HTMLButtonElement>(null)
  const item = resource.data?.item
  const subject = item && resource.data?.subjects.find(value => value.id === item.subject_id)
  const activity = item?.activity_id ? resource.data?.activities.find(value => value.id === item.activity_id) : undefined

  function updateItem(value: StudySession) {
    resource.setData(previous => previous ? { ...previous, item: value } : previous)
  }
  async function refreshConflict() {
    const current = await services.sessions.detail(id)
    updateItem(current)
  }
  function transition(action: 'start' | 'pause' | 'resume', message: string) {
    void mutation.run(signal => services.sessions.transition(id, action, signal), value => { updateItem(value); setNotice(message); mutation.clearError() }, { onConflict: refreshConflict })
  }
  function finish(value: { status: SessionResult; context: StudySession['context']; other_text: string | null }) {
    void mutation.run(signal => services.sessions.finish(id, value, signal), result => {
      updateItem(result); setFinishing(false); setNotice('Sesión finalizada y sincronizada.');
      window.requestAnimationFrame(() => heading.current?.focus())
    }, { onConflict: refreshConflict })
  }
  function closeFinish() {
    setFinishing(false); mutation.clearError()
    window.requestAnimationFrame(() => finishTrigger.current?.focus())
  }
  function closeDelete() {
    setDeleting(false); mutation.clearError()
    window.requestAnimationFrame(() => deleteTrigger.current?.focus())
  }
  function remove() {
    void mutation.run(signal => services.sessions.remove(id, true, signal), () => navigate('/app/sessions', { replace: true, state: { sessionDeleted: true } }), {
      conflictMessage: 'No se puede eliminar porque esta sesión ya inició o tiene historial. El registro se conserva.',
      onConflict: refreshConflict,
    })
  }
  function savePlan(value: StudySessionWrite) {
    void mutation.run(signal => services.sessions.update(id, value, signal), result => {
      updateItem(result); setEditing(false); setNotice('Planificación actualizada.'); resource.retry()
    }, { onConflict: refreshConflict })
  }

  return <section className={styles.page}>
    <Link to="/app/sessions">← Sesiones</Link>
    {resource.loading && <p role="status">Cargando sesión…</p>}
    {resource.error && <div role="alert"><h1>No pudimos abrir la sesión</h1><p>{resource.error}</p><button className="button" type="button" onClick={resource.retry}>Reintentar sesión</button></div>}
    {item && resource.data && !resource.loading && <>
      <div className={styles.heading}><div><h1 ref={heading} tabIndex={-1}>Sesión de {subject?.name ?? `Materia ${item.subject_id}`}</h1><p>Planificación y ejecución real de estudio.</p></div><span className={styles.badge}>{executionStateLabels[item.execution_state]}</span></div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {mutation.error && !finishing && !deleting && <p role="alert" className={styles.error}>{mutation.error}</p>}
      {editing ? <SessionEditPlan session={item} busy={mutation.busy} error={mutation.error} onSave={savePlan} onCancel={() => { setEditing(false); mutation.clearError() }} /> : <>
        <StudySessionTimer session={item} />
        <section className={styles.detail} aria-label="Detalles de la sesión">
          <dl>
            <dt>Materia</dt><dd>{subject?.name ?? `Materia ${item.subject_id}`}</dd>
            <dt>Actividad</dt><dd>{item.activity_id ? (activity ? <Link to={`/app/activities/${activity.id}`}>{activity.title}</Link> : `Actividad ${item.activity_id}`) : 'Sin actividad asociada'}</dd>
            <dt>Fecha planificada</dt><dd><time dateTime={item.planned_start_at}>{localDateTime(item.planned_start_at)}</time></dd>
            <dt>Duración planificada</dt><dd>{item.planned_duration} minutos</dd>
            <dt>Tiempo efectivo</dt><dd>{formatDuration(Math.floor(Number(item.actual_duration)))} confirmados por el servidor</dd>
            <dt>Inicio real</dt><dd>{item.start_at ? <time dateTime={item.start_at}>{localDateTime(item.start_at)}</time> : 'Aún no inicia'}</dd>
            <dt>Fin real</dt><dd>{item.end_at ? <time dateTime={item.end_at}>{localDateTime(item.end_at)}</time> : 'Sin finalizar'}</dd>
            <dt>Resultado</dt><dd>{item.status ? sessionResultLabels[item.status] : 'Pendiente de resultado'}</dd>
            <dt>Contexto</dt><dd>{item.context ? sessionContextLabels[item.context] : 'Sin contexto'}</dd>
            {item.context === 'other' && item.other_text && <><dt>Otro contexto</dt><dd>{item.other_text}</dd></>}
          </dl>
        </section>
        <StudySessionIntervals session={item} />
        <StudySessionActions state={item.execution_state} busy={mutation.busy}
          onStart={() => transition('start', 'Temporizador iniciado y sincronizado.')}
          onPause={() => transition('pause', 'Temporizador pausado y tiempo efectivo sincronizado.')}
          onResume={() => transition('resume', 'Temporizador reanudado y sincronizado.')}
          onFinish={() => { mutation.clearError(); setFinishing(true) }} finishRef={finishTrigger} />
        {item.execution_state === 'planned' && item.start_at === null && item.intervals.length === 0 && <section className={styles.panel}>
          <h2>Plan sin iniciar</h2>
          <p>Puedes ajustar la planificación o eliminar este plan. Una sesión con ejecución conserva su historial.</p>
          <div className={styles.actions}><button className="button" type="button" disabled={mutation.busy} onClick={() => { mutation.clearError(); setEditing(true) }}>Editar planificación</button></div>
          <div className={styles.dangerZone}><h3>Eliminar plan</h3><button ref={deleteTrigger} className={styles.danger} type="button" disabled={mutation.busy} onClick={() => { mutation.clearError(); setDeleting(true) }}>Eliminar plan sin iniciar</button></div>
        </section>}
      </>}
      {finishing && <StudySessionFinishDialog session={item} busy={mutation.busy} error={mutation.error} onCancel={closeFinish} onConfirm={finish} />}
      {deleting && <StudySessionDeleteConfirmation busy={mutation.busy} error={mutation.error} onCancel={closeDelete} onConfirm={remove} />}
    </>}
  </section>
}
