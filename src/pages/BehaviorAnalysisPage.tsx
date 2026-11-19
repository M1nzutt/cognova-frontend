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
        <small>
          {analysis.partial_session_count} {analysis.partial_session_count === 1 ? 'sesión parcial' : 'sesiones parciales'} · {analysis.cancelled_session_count} {analysis.cancelled_session_count === 1 ? 'sesión cancelada' : 'sesiones canceladas'}.
          {' '}{analysis.reviewed_session_count} registros completados o parciales se comparan; las canceladas se mantienen aparte.
        </small>
      </div>
      {analysis.state === 'insufficient_data' || !analysis.observations.length
        ? <div className={styles.empty}>
          <h2>Aún no hay registros para comparar</h2>
          <p>{analysis.insufficient_data_guidance}</p>
          <Link className={styles.emptyAction} to="/app/sessions">Ver mis sesiones</Link>
        </div>
        : <ul className={styles.list} aria-label="Observaciones de tus sesiones">
          {analysis.observations.map(item => <li className={styles.observation} key={item.observation}>
            <span className={styles.eyebrow}>CONCLUSIÓN BASADA EN TUS REGISTROS</span>
            <h2>{item.conclusion}</h2>
            <p className={styles.interpretation}><strong>Interpretación:</strong> {item.interpretation}</p>
            <p className={styles.provenance}>
              {item.interpretation_source === 'gemini'
                ? 'Interpretación generada por Gemini'
                : item.interpretation_source === 'deterministic'
                  ? 'Interpretación basada en reglas locales'
                  : 'Interpretación de respaldo: Gemini no estuvo disponible o su respuesta no superó la validación'}
            </p>
            <p className={styles.interpretation}><strong>Lo que aún no sabemos:</strong> {item.uncertainty}</p>
            <p className={styles.interpretation}><strong>Sugerencia:</strong> {item.suggestion}</p>
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
