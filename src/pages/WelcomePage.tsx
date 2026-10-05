import styles from './WelcomePage.module.css'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function WelcomePage() {
  const { status } = useAuth()
  return (
    <div>
      <p className="eyebrow">BIENVENIDO A COGNOVA</p>
      <h1 className={styles.title}>Tu estudio.<br />Una nueva perspectiva.</h1>
      <p className={styles.intro}>Un lugar para organizar lo que te propones, registrar lo que sucede y comprender cómo estudias.</p>

      <section className={styles.notice} aria-labelledby="welcome-status">
        <span className={styles.dot} aria-hidden="true" />
        <div>
          <h2 id="welcome-status">Tu recorrido empieza aquí</h2>
          <p>Crea tu cuenta para dar el primer paso en Cognova.</p>
          <div className="actions">
            {status === 'authenticated' ? <Link to="/dashboard">Ir a mi espacio</Link> : (
              <><Link to="/register">Crear cuenta</Link><Link to="/login">Iniciar sesión</Link></>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="journey-title" className={styles.journey}>
        <h2 id="journey-title">Cada registro, un poco más de claridad.</h2>
        <p>Así será tu recorrido en Cognova.</p>
        <div className={styles.grid}>
          <article className={styles.card}>
            <span className={styles.step}>01 / ORGANIZAR</span>
            <h3>Dale espacio a tus objetivos</h3>
            <p>Reúne tus materias, actividades y sesiones en una planificación que puedas revisar.</p>
          </article>
          <article className={styles.card}>
            <span className={styles.step}>02 / REGISTRAR</span>
            <h3>Conserva tu recorrido</h3>
            <p>Registra tus sesiones y su contexto para entender qué ocurre más allá del plan.</p>
          </article>
          <article className={styles.card}>
            <span className={styles.step}>03 / REFLEXIONAR</span>
            <h3>Conecta lo que observas</h3>
            <p>Explora la evidencia con un acompañante académico. Tú interpretas y decides.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
