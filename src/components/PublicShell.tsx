import { Link, Outlet, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import styles from './PublicShell.module.css'

export function PublicShell() {
  const { pathname } = useLocation()

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <header className={styles.header}>
        <Link className={styles.brand} to="/" aria-label="Cognova, inicio">
          <span className={styles.brandMark} aria-hidden="true"><Icon name="orbit" size={24} /></span>
          <span>Cognova</span>
        </Link>
        <nav className={styles.navigation} aria-label="Navegación pública">
          {pathname === '/login' ? (
            <>
              <span className={styles.navHint}>¿Primera vez en Cognova?</span>
              <Link className={`${styles.navLink} ${styles.navPrimary}`} to="/register">Crear cuenta</Link>
            </>
          ) : pathname === '/register' ? (
            <>
              <span className={styles.navHint}>¿Ya tienes una cuenta?</span>
              <Link className={styles.navLink} to="/login">Iniciar sesión</Link>
            </>
          ) : (
            <>
              <Link className={styles.navLink} to="/login">Iniciar sesión</Link>
              <Link className={`${styles.navLink} ${styles.navPrimary}`} to="/register">Crear cuenta</Link>
            </>
          )}
        </nav>
      </header>
      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>Cognova</span>
        <span>Tu espacio de estudio inteligente.</span>
      </footer>
    </div>
  )
}
