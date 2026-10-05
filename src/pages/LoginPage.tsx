import { useState } from 'react'
import type { FormEvent } from 'react'
import { AuthFormLayout } from '../components/AuthFormLayout'
import styles from '../components/AuthFormLayout.module.css'
import { useAuth } from '../hooks/useAuth'
import { useAuthForm } from '../hooks/useAuthForm'
import { validateLogin } from '../utils/authValidation'

export function LoginPage() {
  const { session, message, logoutFailed } = useAuth()
  const { loading, error, submit } = useAuthForm('/dashboard')
  const [validation, setValidation] = useState<string | null>(null)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const credentials = { email: String(data.get('email') ?? '').trim(), password: String(data.get('password') ?? '') }
    const issue = validateLogin(credentials)
    setValidation(issue)
    if (!issue) void submit((signal) => session.login(credentials, signal))
  }

  return (
    <AuthFormLayout title="Inicia sesión" description="Retoma tu recorrido en Cognova." alternative="¿Aún no tienes cuenta?" linkText="Regístrate" linkTo="/register">
      {message && <p role="status" className={styles.feedback}>{message}</p>}
      {logoutFailed && <button className="button" type="button" onClick={() => void session.logout()}>Reintentar cierre de sesión</button>}
      <form className={styles.form} onSubmit={onSubmit} aria-busy={loading}>
        <fieldset className={styles.fieldset} disabled={loading || logoutFailed}>
          <label className={styles.field}>Correo electrónico
            <input className={styles.input} name="email" type="email" autoComplete="email" required />
          </label>
          <label className={styles.field}>Contraseña
            <input className={styles.input} name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className={`button ${styles.submit}`} type="submit">{loading ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
        </fieldset>
        {(validation || error) && <p role="alert" className={styles.feedback}>{validation || error}</p>}
        {loading && <p role="status">Comprobando tus datos…</p>}
      </form>
    </AuthFormLayout>
  )
}
