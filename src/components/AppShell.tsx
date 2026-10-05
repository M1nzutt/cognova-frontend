import { NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import styles from './AppShell.module.css'

export function AppShell() {
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
        </nav>
        <p className={styles.sidebarNote}>Un espacio para observar, conectar y aprender de tu recorrido.</p>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <span>Un nuevo punto de partida</span>
          <ThemeToggle />
        </header>
        <main id="main-content" className={styles.content} tabIndex={-1}>
          <Outlet />
        </main>
        <footer className={styles.footer}>Tu experiencia, con perspectiva.</footer>
      </div>
    </div>
  )
}
