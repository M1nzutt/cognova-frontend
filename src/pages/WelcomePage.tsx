import styles from './WelcomePage.module.css'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Icon } from '../components/Icon'

export function WelcomePage() {
  const { status } = useAuth()
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="welcome-title">
        <div className={styles.heroCopy}>
          <p className="eyebrow">BIENVENIDO A COGNOVA</p>
          <h1 id="welcome-title" className={styles.title}>Tu estudio.<br />Una nueva perspectiva.</h1>
          <p className={styles.intro}>Un lugar para organizar lo que te propones, registrar lo que sucede y comprender cómo estudias.</p>
          <div className={styles.heroActions}>
            {status === 'authenticated' ? <Link className={styles.heroPrimary} to="/dashboard">Ir a mi espacio</Link> : <>
              <Link className={styles.heroPrimary} to="/register">Crear cuenta</Link>
              <Link className={styles.heroSecondary} to="/login">Iniciar sesión</Link>
            </>}
          </div>
        </div>
        <div className={styles.heroArtwork} aria-hidden="true">
          <div className={styles.orbit}>
            <span className={styles.orbitCore}><Icon name="orbit" size={38} /></span>
            <span className={styles.orbitDot} />
            <span className={styles.orbitDot} />
          </div>
        </div>
      </section>
      <section className={styles.journey} aria-labelledby="journey-title">
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