import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ThemeToggle } from './ThemeToggle'
import styles from './EntryShell.module.css'

export function EntryShell() {
  const { status, user, session } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const step = pathname === '/register' ? 0 : user?.onboarding.next_step === 'academic_profile' ? 1 : 2
  return <div className={styles.entry}>
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <header className={styles.header}>
      <Link to="/" className={styles.brand} aria-label="Cognova, inicio"><span aria-hidden="true">c°</span> Cognova</Link>
      <div className="actions"><ThemeToggle />{status === 'authenticated' && <button className="button" onClick={() => { void session.logout(); navigate('/login', { replace: true }) }}>Cerrar sesión</button>}</div>
    </header>
    <main id="main-content" className={styles.main} tabIndex={-1}>
      {pathname !== '/login' && <ol className={styles.steps} aria-label="Progreso de bienvenida">
        {['Cuenta', 'Perfil académico', 'Percepción inicial'].map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined}><span aria-hidden="true">{index < step ? '✓' : index + 1}</span>{label}</li>)}
      </ol>}
      <Outlet />
    </main>
    <footer className={styles.footer}>Tu experiencia, con perspectiva.</footer>
  </div>
}
