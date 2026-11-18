import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useStudyPlanServices } from '../hooks/useStudyPlanServices'
import { useStudyPlanResource } from '../hooks/useStudyPlanResource'
import styles from './BehaviorAnalysisPage.module.css'
import { LoadingStatus } from '../components/LoadingStatus'
import { formatDuration } from '../utils/formatDuration'

export function BehaviorAnalysisPage() {
  const services = useStudyPlanServices()
  const load = useCallback((signal: AbortSignal) => services.behavior.analyze(signal), [services])
  const resource = useStudyPlanResource(load)
  const analysis = resource.data
  return <section className={styles.page} aria-labelledby="behavior-title">
    <div className={styles.heading}>
      <div><p className="eyebrow">TUS REGISTROS</p><h1 id="behavior-title">Observaciones de tus sesiones</h1>
        <p>Hechos de tus registros, sin convertirlos en conclusiones sobre tus hábitos.</p></div>
      <button className="button" type="button" onClick={resource.retry} disabled={resource.loading}>{resource.loading ? 'Actualizando…' : 'Actualizar'}</button>
    </div>
    {resource.loading && <LoadingStatus label="Revisando tus sesiones registradas…" />}
    {resource.error && <div className={styles.error} role="alert"><div><h2>No pudimos cargar las observaciones</h2><p>{resource.error}</p></div><button className="button" type="button" onClick={resource.retry}>Intentar de nuevo</button></div>}
    {analysis && !resource.loading && !resource.error && <>
      <div className={styles.summary} role="status">
        <strong>{analysis.completed_session_count}</strong>
        <span>{analysis.completed_session_count === 1 ? 'sesión completada' : 'sesiones completadas'}</span>
        <small>{analysis.reviewed_session_count} {analysis.reviewed_session_count === 1 ? 'registro completado o parcial revisado' : 'registros completados o parciales revisados'}. Los parciales no cuentan como sesiones completadas.</small>
      </div>
      {analysis.state === 'insufficient_data' || !analysis.observations.length
        ? <div className={styles.empty}>
          <h2>Aún no hay registros para comparar</h2>
          <p>Cuando haya sesiones finalizadas con duración registrada, mostraremos los datos disponibles sin inferir hábitos.</p>
          <Link className={styles.emptyAction} to="/app/sessions">Ver mis sesiones</Link>
        </div>
        : <ul className={styles.list} aria-label="Observaciones de tus sesiones">
          {analysis.observations.map(item => <li className={styles.observation} key={item.observation}>
            <span className={styles.eyebrow}>DATO DE TUS REGISTROS</span>
            <h2>{item.observation}</h2>
            <p className={styles.interpretation}><strong>Qué puede significar:</strong> {item.interpretation}</p>
            <details className={styles.evidence}>
              <summary>Ver {item.evidence.length === 1 ? 'el registro' : `los ${item.evidence.length} registros`} que lo respaldan</summary>
              <ul>{item.evidence.map(entry => <li key={entry.session_id}>
                <span>{entry.summary}; se registraron {formatDuration(entry.actual_seconds)}.</span>
                <small>Estado del registro: {entry.result === 'completed' ? 'completada' : 'parcial'}.</small>
              </li>)}</ul>
              {!!item.related_resources.length && <nav className={styles.related} aria-label="Consultar registros y recursos">
                <strong>Consultar:</strong>
                {item.related_resources.map(resource => <Link key={`${resource.kind}-${resource.id}`} to={resource.href}>{resource.label}</Link>)}
              </nav>}
            </details>
            <section className={styles.reflection}>
              <h3>Pregunta para ti</h3><p>{item.question}</p>
            </section>
            <p className={styles.scope}>{item.confidence_basis}</p>
          </li>)}
        </ul>}
    </>}
  </section>
}
