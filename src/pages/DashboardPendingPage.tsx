import { useAuth } from '../hooks/useAuth'
import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/ApiError'
import styles from './DashboardPendingPage.module.css'

export function DashboardPendingPage() {
  const { user, session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])

  const refreshProfile = async () => {
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    setError(null)
    setFeedback(null)
    try {
      await session.reloadProfile(controller.signal)
      if (!controller.signal.aborted) setFeedback('Tu perfil está actualizado.')
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof ApiError ? failure.message : 'No pudimos actualizar tu perfil. Inténtalo de nuevo.')
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setLoading(false)
    }
  }

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
      <p className={styles.sessionNote}>Has iniciado sesión correctamente.</p>
      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="profile-title">
          <div className={styles.cardHeading}>
            <h2 id="profile-title">Tu perfil académico</h2>
            <span className={styles.initial} aria-hidden="true">{user?.name.slice(0, 1).toLocaleUpperCase('es')}</span>
          </div>
          <dl className={styles.profile}>
            <div><dt>Nombre</dt><dd>{user?.name}</dd></div>
            <div><dt>Correo</dt><dd>{user?.email}</dd></div>
            <div><dt>Carrera</dt><dd>{user?.degree_program || 'Sin carrera registrada'}</dd></div>
            <div><dt>Semestre</dt><dd>{user?.semester}</dd></div>
          </dl>
          <button className="button" type="button" disabled={loading} onClick={() => void refreshProfile()}>
            {loading ? 'Actualizando…' : 'Actualizar perfil'}
          </button>
          {loading && <p role="status">Consultando tu perfil…</p>}
          {feedback && <p role="status">{feedback}</p>}
          {error && <p role="alert">{error}</p>}
        </section>
        <section className={`${styles.card} ${styles.goal}`} aria-labelledby="goal-title">
          <p className="eyebrow">TU NORTE</p>
          <h2 id="goal-title">Lo que quieres lograr</h2>
          <p className={styles.goalText}>{user?.academic_goal || 'Aún no tienes un objetivo académico registrado.'}</p>
          <p className={styles.muted}>Este es el objetivo que compartiste al crear tu cuenta.</p>
        </section>
      </div>
      <section className={styles.next} aria-labelledby="next-title">
        <span className={styles.release}>AVANCE INICIAL</span>
        <h2 id="next-title">Tu recorrido apenas comienza</h2>
        <p>Tu cuenta ya tiene un lugar en Cognova. En próximas entregas podrás organizar tus materias, registrar sesiones y explorar tu progreso.</p>
        <p className={styles.muted}>Esta versión presenta tu perfil y acceso seguro. Las herramientas de estudio aún no están disponibles.</p>
      </section>
    </section>
  )
}
