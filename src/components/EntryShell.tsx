import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Icon } from './Icon'
import styles from './EntryShell.module.css'

export function EntryShell() {
  const { status, user, session } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const step = pathname === '/register' ? 0 : user?.onboarding.next_step === 'academic_profile' ? 1 : 2
  return <div className={styles.entry}>
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <header className={styles.header}>
      <Link to="/" className={styles.brand} aria-label="Cognova, inicio"><span className={styles.mark}><Icon name="orbit" size={25} /></span><span>Cognova</span></Link>
      <div className={styles.headerActions}>{status === 'authenticated' && <button className={styles.logout} type="button" onClick={() => { void session.logout(); navigate('/login', { replace: true }) }}><Icon name="logout" size={18} /><span>Cerrar sesión</span></button>}</div>
    </header>
    <main id="main-content" className={styles.main} tabIndex={-1}>
      <div className={styles.layout}>
        <section className={styles.guide} aria-label="Acerca de Cognova">
          <p className="eyebrow">UN ESPACIO PARA APRENDER</p>
          <div className={styles.orbit} aria-hidden="true"><span /><span /><i /></div>
          <h2>Organiza lo que quieres hacer. Comprende lo que vas aprendiendo.</h2>
          <p>Cada registro suma una perspectiva. Tu recorrido siempre queda en tus manos.</p>
          <ul><li>Planea con intención</li><li>Registra lo que ocurre</li><li>Decide con evidencia</li></ul>
        </section>
        <div className={styles.formColumn}>
          {pathname !== '/login' && <ol className={styles.steps} aria-label="Progreso de bienvenida">
            {['Cuenta', 'Perfil académico', 'Percepción inicial'].map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined}><span aria-hidden="true">{index < step ? '✓' : index + 1}</span>{label}</li>)}
          </ol>}
          <Outlet />
        </div>
      </div>
    </main>
    <footer className={styles.footer}>Tu experiencia, con perspectiva.</footer>
  </div>
}