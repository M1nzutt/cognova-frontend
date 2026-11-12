import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useStudyPlanServices } from '../hooks/useStudyPlanServices'
import { useStudyPlanResource } from '../hooks/useStudyPlanResource'
import styles from '../components/StudyPlans.module.css'

export function BehaviorAnalysisPage() {
  const services = useStudyPlanServices()
  const load = useCallback((signal: AbortSignal) => services.behavior.analyze(signal), [services])
  const resource = useStudyPlanResource(load)
  const analysis = resource.data
  return <section className={styles.page}>
    <div className={styles.heading}>
      <div><p className="eyebrow">TU RECORRIDO</p><h1>Observaciones de tus sesiones</h1>
        <p>Una mirada cuidadosa a lo que registras al estudiar, para ayudarte a reflexionar.</p></div>
      <button className="button" type="button" onClick={resource.retry}>Actualizar</button>
    </div>
    {resource.loading && <p role="status">Revisando tus sesiones…</p>}
    {resource.error && <div role="alert"><p>{resource.error}</p><button className="button" type="button" onClick={resource.retry}>Intentar de nuevo</button></div>}
    {analysis && !resource.loading && !resource.error && <>
      <p role="status">Se tuvieron en cuenta {analysis.finished_session_count} sesiones finalizadas.</p>
      {!analysis.pattern_eligible && <p className={styles.notice}>Aún hacen falta sesiones para identificar patrones. Cognova necesita al menos cinco sesiones finalizadas para preparar observaciones de este tipo.</p>}
      {analysis.observations.length === 0 ? <div className={styles.empty}>
        <h2>{analysis.pattern_eligible ? 'Todavía no hay observaciones' : 'Sigue registrando tus sesiones'}</h2>
        <p>Cuando haya información suficiente, podrás revisar observaciones y preguntas basadas en tus registros.</p>
        <Link to="/app/sessions">Ir a sesiones</Link>
      </div> : <ul className={styles.list} aria-label="Observaciones de tus sesiones">
        {analysis.observations.map((item, index) => <li className={styles.panel} key={`${item.observation}-${index}`}>
          <h2>{analysis.pattern_eligible ? 'Una observación para reflexionar' : 'Dato de tus sesiones'}</h2>
          <p>{item.observation}</p>
          <h3>Lo que muestran tus registros</h3>
          <ul>{item.evidence.map((fact, factIndex) => <li key={factIndex}>{fact}</li>)}</ul>
          <p><strong>Pregunta para ti:</strong> {item.question}</p>
          <p><strong>Base de esta observación:</strong> {item.confidence_basis}</p>
          {(item.related_subject_ids.length + item.related_activity_ids.length + item.related_session_ids.length > 0) && <nav aria-label="Recursos relacionados">
            <ul className={styles.actions}>
              {item.related_subject_ids.map((id, linkIndex) => <li key={`subject-${id}`}><Link to={`/app/subjects/${id}`} aria-label={`Abrir materia relacionada ${linkIndex + 1}`}>Materia relacionada</Link></li>)}
              {item.related_activity_ids.map((id, linkIndex) => <li key={`activity-${id}`}><Link to={`/app/activities/${id}`} aria-label={`Abrir actividad relacionada ${linkIndex + 1}`}>Actividad relacionada</Link></li>)}
              {item.related_session_ids.map((id, linkIndex) => <li key={`session-${id}`}><Link to={`/app/sessions/${id}`} aria-label={`Abrir sesión relacionada ${linkIndex + 1}`}>Sesión relacionada</Link></li>)}
            </ul>
          </nav>}
        </li>)}
      </ul>}
      <p className={styles.muted}>Estas observaciones son tentativas y se basan en los registros mostrados. No son diagnósticos ni explicaciones definitivas.</p>
    </>}
  </section>
}
