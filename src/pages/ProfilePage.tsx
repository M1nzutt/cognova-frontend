import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/ApiError'
import { LoadingStatus } from '../components/LoadingStatus'
import { useAuth } from '../hooks/useAuth'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
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
      if (!controller.signal.aborted) {
        setError(failure instanceof ApiError ? failure.message : 'No pudimos actualizar tu perfil. Inténtalo de nuevo.')
      }
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return <section className={styles.page} aria-labelledby="profile-title">
    <header className={styles.heading}>
      <div>
        <p className="eyebrow">TU ESPACIO PERSONAL</p>
        <h1 id="profile-title">Perfil</h1>
        <p>Consulta la información académica asociada a tu cuenta.</p>
      </div>
      <Link className={styles.backLink} to="/dashboard">Volver al inicio <span aria-hidden="true">→</span></Link>
    </header>

    <div className={styles.layout}>
      <section className={styles.details} aria-labelledby="academic-profile-title">
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">{user?.name.slice(0, 1).toLocaleUpperCase('es')}</span>
          <div>
            <p className="eyebrow">PERFIL ACADÉMICO</p>
            <h2 id="academic-profile-title">{user?.name}</h2>
            <p>Tu información personal y académica.</p>
          </div>
        </div>

        <dl className={styles.fields}>
          <div><dt>Nombre</dt><dd>{user?.name}</dd></div>
          <div><dt>Correo electrónico</dt><dd>{user?.email}</dd></div>
          <div><dt>Carrera</dt><dd>{user?.degree_program || 'Sin carrera registrada'}</dd></div>
          <div><dt>Semestre</dt><dd>{user?.semester ?? 'Sin semestre registrado'}</dd></div>
        </dl>

        <div className={styles.refresh}>
          <div>
            <h3>¿Necesitas sincronizar tus datos?</h3>
            <p>Volver a consultar tu perfil en Cognova.</p>
          </div>
          <button className="button" type="button" disabled={loading} onClick={() => void refreshProfile()}>
            {loading ? 'Actualizando…' : 'Actualizar perfil'}
          </button>
        </div>
        {loading && <LoadingStatus label="Consultando tu perfil…" />}
        {feedback && <p role="status" className={styles.feedback}>{feedback}</p>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </section>

      <aside className={styles.aside} aria-labelledby="perception-title">
        <span className={styles.asideMark} aria-hidden="true">✦</span>
        <p className="eyebrow">TU RECORRIDO</p>
        <h2 id="perception-title">Tu percepción también evoluciona.</h2>
        <p>Consulta tus respuestas iniciales y las revisiones que has guardado a lo largo del tiempo.</p>
        <Link to="/app/questionnaire">Consultar mi percepción <span aria-hidden="true">→</span></Link>
      </aside>
    </div>
  </section>
}
