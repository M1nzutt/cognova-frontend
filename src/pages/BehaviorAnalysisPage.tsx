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
      <div><p className="eyebrow">UN ESPACIO PARA PENSAR</p><h1 id="behavior-title">Una pausa para mirar tu estudio</h1>
        <p>No es una evaluación. Es una invitación a poner tus registros en contexto y decidir qué te gustaría probar.</p></div>
      <button className="button" type="button" onClick={resource.retry} disabled={resource.loading}>{resource.loading ? 'Revisando…' : 'Actualizar'}</button>
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
          <h2>Podemos empezar cuando tengas una sesión registrada</h2>
          <p>Cuando cierres algunas sesiones, Cognova podrá ayudarte a comparar lo que planeaste con lo que alcanzaste a registrar. No hay una forma correcta o incorrecta de estudiar.</p>
          <Link className={styles.emptyAction} to="/app/sessions">Ver mis sesiones</Link>
        </div>
        : <ul className={styles.list} aria-label="Observaciones de tus sesiones">
          {analysis.observations.map(item => <li className={styles.observation} key={item.observation}>
            <section className={styles.reflection}>
              <span className={styles.eyebrow}>PARA PENSAR, SIN PRISA</span>
              <h2>¿Qué te dice a ti esta comparación?</h2>
              <p>{item.question}</p>
            </section>
            <div className={styles.observationBody}>
              <span className={styles.eyebrow}>LO QUE APARECE EN TUS REGISTROS</span>
              <h3>{item.conclusion}</h3>
              {item.interpretation && <p className={styles.interpretation}><strong>Una posible lectura:</strong> {item.interpretation}</p>}
              {item.suggestion && <p className={styles.interpretation}><strong>Si te sirve, podrías probar:</strong> {item.suggestion}</p>}
              <details className={styles.evidence}>
                <summary>Cómo se preparó esta observación</summary>
                <p className={styles.provenance}>
                  {item.interpretation_source === 'gemini'
                    ? 'Cognova pidió a Gemini una interpretación breve a partir de estos registros.'
                    : item.interpretation_source === 'deterministic'
                      ? 'Esta lectura se preparó con reglas de Cognova; no se usó Gemini.'
                      : 'Se muestra una lectura de respaldo porque Gemini no estuvo disponible o su respuesta no pasó la validación.'}
                </p>
                <p className={styles.scope}>{item.uncertainty} {item.confidence_basis}</p>
              </details>
            </div>
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
          </li>)}
        </ul>}
    </>}
  </section>
}
