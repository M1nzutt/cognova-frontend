import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useStudyPlanServices } from '../hooks/useStudyPlanServices'
import { useStudyPlanResource } from '../hooks/useStudyPlanResource'
import styles from './BehaviorAnalysisPage.module.css'

export function BehaviorAnalysisPage() {
  const services = useStudyPlanServices()
  const load = useCallback((signal: AbortSignal) => services.behavior.analyze(signal), [services])
  const resource = useStudyPlanResource(load)
  const analysis = resource.data
  return <section className={styles.page} aria-labelledby="behavior-title">
    <div className={styles.heading}>
      <div><p className="eyebrow">IA Y REFLEXIONES</p><h1 id="behavior-title">Observaciones de tus sesiones</h1>
        <p>Una lectura cuidadosa de lo que registras al estudiar, para ayudarte a reflexionar; no es un diagnóstico ni una explicación definitiva.</p></div>
      <button className="button" type="button" onClick={resource.retry} disabled={resource.loading}>{resource.loading ? 'Revisando…' : 'Actualizar observaciones'}</button>
    </div>
    <div className={styles.principles} aria-label="Cómo se preparan las observaciones">
      <div><strong>Señales</strong><span>Sesiones que registraste y finalizaste.</span></div>
      <div><strong>Evidencia</strong><span>Cada observación muestra los registros que la respaldan.</span></div>
      <div><strong>Tu criterio</strong><span>La interpretación y las decisiones siguen siendo tuyas.</span></div>
    </div>
    {resource.loading && <p className={styles.loading} role="status"><span aria-hidden="true" />Revisando tus sesiones registradas…</p>}
    {resource.error && <div className={styles.error} role="alert"><div><h2>No pudimos cargar las observaciones</h2><p>{resource.error}</p></div><button className="button" type="button" onClick={resource.retry}>Intentar de nuevo</button></div>}
    {analysis && !resource.loading && !resource.error && <>
      <div className={styles.summary} role="status">
        <span className={styles.summaryNumber}>{analysis.finished_session_count}</span>
        <p>{analysis.finished_session_count === 1 ? 'sesión finalizada registrada' : 'sesiones finalizadas registradas'}<small>Solo se cuentan sesiones finalizadas para esta revisión.</small></p>
      </div>
      {!analysis.pattern_eligible && <p className={styles.notice}>Aún hacen falta sesiones para identificar patrones. Cognova necesita al menos cinco sesiones finalizadas para preparar observaciones de este tipo. Antes de eso, cualquier dato se presenta sin llamarlo patrón.</p>}
      {analysis.observations.length === 0 ? <div className={styles.empty}>
        <h2>{analysis.pattern_eligible ? 'Todavía no hay observaciones' : 'Sigue registrando tus sesiones'}</h2>
        <p>Las observaciones dependen de tus registros. Continúa a tu ritmo; esta vista no completa datos que no hayas registrado.</p>
        <Link className={styles.emptyAction} to="/app/sessions">Ver mis sesiones</Link>
      </div> : <ul className={styles.list} aria-label="Observaciones de tus sesiones">
        {analysis.observations.map((item, index) => <li className={styles.observation} key={`${item.observation}-${index}`}>
          <div className={styles.observationTop}><span>{analysis.pattern_eligible ? 'PARA REFLEXIONAR' : 'REGISTRO, NO PATRÓN'}</span><span>{item.evidence.length} {item.evidence.length === 1 ? 'evidencia' : 'evidencias'}</span></div>
          <h2>{analysis.pattern_eligible ? 'Una observación para reflexionar' : 'Dato de tus sesiones'}</h2>
          <p className={styles.observationText}>{item.observation}</p>
          <section className={styles.evidence} aria-label="Evidencia de la observación">
            <h3>Lo que muestran tus registros</h3>
            <ul>{item.evidence.map((fact, factIndex) => <li key={factIndex}>{fact}</li>)}</ul>
          </section>
          <section className={styles.reflection}>
            <h3>Pregunta para ti</h3><p>{item.question}</p>
          </section>
          <p className={styles.confidence}><strong>Base y alcance:</strong> {item.confidence_basis}</p>
          {(item.related_subject_ids.length + item.related_activity_ids.length + item.related_session_ids.length > 0) && <nav className={styles.related} aria-label="Recursos relacionados">
            {item.related_subject_ids.map((id, linkIndex) => <Link key={`subject-${id}`} to={`/app/subjects/${id}`} aria-label={`Abrir materia relacionada ${linkIndex + 1}`}>Materia relacionada ↗</Link>)}
            {item.related_activity_ids.map((id, linkIndex) => <Link key={`activity-${id}`} to={`/app/activities/${id}`} aria-label={`Abrir actividad relacionada ${linkIndex + 1}`}>Actividad relacionada ↗</Link>)}
            {item.related_session_ids.map((id, linkIndex) => <Link key={`session-${id}`} to={`/app/sessions/${id}`} aria-label={`Abrir sesión relacionada ${linkIndex + 1}`}>Sesión relacionada ↗</Link>)}
          </nav>}
        </li>)}
      </ul>}
      <p className={styles.disclaimer}>Estas observaciones son tentativas y reflejan únicamente la información disponible. Pueden omitir contexto importante: úsalas como punto de partida, no como una conclusión sobre ti.</p>
    </>}
  </section>
}
