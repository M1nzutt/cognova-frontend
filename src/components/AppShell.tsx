import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Icon, type IconName } from './Icon'
import styles from './AppShell.module.css'

interface RouteLink {
  to: string
  label: string
  icon: IconName
  end?: boolean
}

const mainLinks: RouteLink[] = [
  { to: '/dashboard', label: 'Inicio', icon: 'home', end: true },
  { to: '/app/calendar', label: 'Calendario', icon: 'calendar' },
  { to: '/app/subjects', label: 'Materias', icon: 'book' },
  { to: '/app/study-plans', label: 'Planes', icon: 'layers' },
]

const secondaryLinks: RouteLink[] = [
  { to: '/app/activities', label: 'Actividades', icon: 'activity' },
  { to: '/app/sessions', label: 'Sesiones', icon: 'timer' },
  { to: '/app/behavior', label: 'IA y reflexiones', icon: 'sparkles' },
  { to: '/app/analytics', label: 'Análisis', icon: 'chart' },
]

function RouteLinkItem({ to, label, icon, end, onSelect }: RouteLink & { onSelect?: () => void }) {
  return <NavLink className={styles.navLink} to={to} end={end} onClick={onSelect}>
    <Icon name={icon} />
    <span>{label}</span>
  </NavLink>
}

export function AppShell() {
  const { status, user, session } = useAuth()
  const navigate = useNavigate()
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    const update = (event: MediaQueryListEvent) => {
      setIsCompact(event.matches)
      setMoreOpen(false)
    }
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  const logout = () => { void session.logout(); navigate('/login', { replace: true }) }
  const authenticated = status === 'authenticated'

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <aside className={styles.sidebar}>
        <NavLink className={styles.brand} to="/dashboard" aria-label="Cognova, inicio">
          <span className={styles.mark}><Icon name="orbit" size={25} /></span>
          <span>Cognova</span>
        </NavLink>
        <p className={styles.caption}>TU ESPACIO DE ESTUDIO</p>
        {authenticated ? <nav className={styles.navigation} aria-label="Navegación principal">
          <div className={styles.primaryLinks}>{mainLinks.map(item => <RouteLinkItem key={item.to} {...item} />)}</div>
          <details className={styles.more} open={!isCompact || moreOpen} onToggle={event => {
            if (isCompact) setMoreOpen(event.currentTarget.open)
          }}>
            <summary aria-label="Más secciones"><Icon name="more" /><span>Más</span></summary>
            <div className={styles.moreLinks} hidden={isCompact && !moreOpen}>
              {secondaryLinks.map(item => <RouteLinkItem key={item.to} {...item} onSelect={() => setMoreOpen(false)} />)}
            </div>
          </details>
        </nav> : <nav className={`${styles.navigation} ${styles.guestNavigation}`} aria-label="Navegación principal">
          <RouteLinkItem to="/" label="Inicio" icon="home" end />
          <RouteLinkItem to="/login" label="Iniciar sesión" icon="orbit" />
          <RouteLinkItem to="/register" label="Crear cuenta" icon="sparkles" />
        </nav>}
        {authenticated && <div className={styles.profile}>
          <span className={styles.avatar} aria-hidden="true">{user?.name.slice(0, 1).toLocaleUpperCase('es')}</span>
          <span className={styles.profileName}>{user?.name}</span>
          <span className={styles.profileCaption}>Tu recorrido académico</span>
        </div>}
      </aside>

      <div className={styles.workspace}>
        <header className={styles.header}>
          <span className={styles.headerText}>Un espacio para observar y aprender</span>
          <div className={styles.headerActions}>
            {authenticated && <button className={styles.logout} type="button" onClick={logout}><Icon name="logout" size={18} /><span>Cerrar sesión</span></button>}
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