import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '../hooks/useAuth'
import styles from './AppShell.module.css'

export function AppShell() {
  const { status, session } = useAuth()
  const navigate = useNavigate()
  const logout = () => { void session.logout(); navigate('/login', { replace: true }) }
  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <aside className={styles.sidebar}>
        <NavLink className={styles.brand} to="/" aria-label="Cognova, inicio">
          <span className={styles.mark} aria-hidden="true">c<span>°</span></span>
          Cognova
        </NavLink>
        <p className={styles.caption}>TU ESPACIO ACADÉMICO</p>
        <nav aria-label="Navegación principal">
          <NavLink className={styles.navLink} to="/" end>Inicio</NavLink>
          {status === 'authenticated' ? <NavLink className={styles.navLink} to="/dashboard">Mi espacio</NavLink> : status === 'anonymous' && (
            <>
              <NavLink className={styles.navLink} to="/login">Iniciar sesión</NavLink>
              <NavLink className={styles.navLink} to="/register">Crear cuenta</NavLink>
            </>
          )}
        </nav>
        <p className={styles.sidebarNote}>Un espacio para observar, conectar y aprender de tu recorrido.</p>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <span>Un nuevo punto de partida</span>
          <div className="actions">
            <ThemeToggle />
            {status === 'authenticated' && <button className="button" type="button" onClick={logout}>Cerrar sesión</button>}
          </div>
        </header>
        <main id="main-content" className={styles.content} tabIndex={-1}>
          <Outlet />
        </main>
        <footer className={styles.footer}>Tu experiencia, con perspectiva.</footer>
      </div>
    </div>
  )
}
