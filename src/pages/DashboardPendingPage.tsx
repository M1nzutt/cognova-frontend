import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './DashboardPendingPage.module.css'

export function DashboardPendingPage() {
  const { user } = useAuth()

  return (
    <section className={styles.dashboard} aria-labelledby="dashboard-title">
      <p className="eyebrow">TU ESPACIO ACADÉMICO</p>
      <div className={styles.heading}>
        <div>
          <h1 id="dashboard-title">Hola, {user?.name}.</h1>
          <p>Un punto de partida para mirar tu estudio con perspectiva.</p>
        </div>
        <span className={styles.badge}>Sesión iniciada</span>
      </div>
      <section className={styles.perception} aria-labelledby="perception-title">
        <div>
          <p className="eyebrow">TU RECORRIDO</p>
          <h2 id="perception-title">Tu percepción inicial forma parte de tu proceso.</h2>
          <p>Puedes volver a tus respuestas y revisar cómo cambia tu perspectiva con el tiempo.</p>
        </div>
        <Link to="/app/questionnaire">Consultar mi percepción <span aria-hidden="true">→</span></Link>
      </section>
      <section className={styles.next} aria-labelledby="next-title">
        <div className={styles.nextHeading}>
          <div><span className={styles.release}>UN SIGUIENTE PASO, A TU ELECCIÓN</span><h2 id="next-title">¿Qué quieres avanzar hoy?</h2></div>
          <p>Accede directamente a tus herramientas. Elige por dónde empezar.</p>
        </div>
        <div className={styles.quickActions}>
          <Link className={`${styles.quickAction} ${styles.featuredAction}`} to="/app/sessions/new">
            <span><strong>Agendar una sesión</strong><small>Reserva un espacio para estudiar</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
          </Link>
          <Link className={styles.quickAction} to="/app/activities/new">
            <span><strong>Crear una actividad</strong><small>Registra algo que necesitas hacer</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
          </Link>
          <Link className={styles.quickAction} to="/app/calendar">
            <span><strong>Ver calendario</strong><small>Consulta sesiones y fechas límite</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
          </Link>
          <Link className={styles.quickAction} to="/app/behavior">
            <span><strong>Revisar reflexiones</strong><small>Explora observaciones de tu recorrido</small></span><span className={styles.arrow} aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </section>
  )
}
