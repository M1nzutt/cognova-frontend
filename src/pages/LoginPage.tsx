import { useState } from 'react'
import type { FormEvent } from 'react'
import { AuthFormLayout } from '../components/AuthFormLayout'
import { PasswordField } from '../components/PasswordField'
import styles from '../components/PublicAuthForm.module.css'
import { useAuth } from '../hooks/useAuth'
import { useAuthForm } from '../hooks/useAuthForm'
import { validateLogin } from '../utils/authValidation'

export function LoginPage() {
  const { session, message, logoutFailed } = useAuth()
  const { loading, error, submit } = useAuthForm()
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
    <AuthFormLayout
      title="Inicia sesión"
      description="Retoma tu recorrido en Cognova."
      alternative="¿Aún no tienes cuenta?"
      linkText="Regístrate"
      linkTo="/register"
      contextLabel="BIENVENIDA DE VUELTA"
      storyTitle="Retoma tu recorrido con una mirada nueva."
      storyDescription="Vuelve a tus planes y registros. Cognova te ayuda a conectar lo que haces con lo que quieres aprender."
    >
      {message && <p role="status" className={styles.feedback}>{message}</p>}
      {logoutFailed && <button className="button" type="button" onClick={() => void session.logout()}>Reintentar cierre de sesión</button>}
      <form className={styles.form} onSubmit={onSubmit} aria-busy={loading}>
        <fieldset className={styles.fieldset} disabled={loading || logoutFailed}>
          <div className={styles.field}>
            <label htmlFor="login-email">Correo electrónico</label>
            <input id="login-email" className={styles.input} name="email" type="email" autoComplete="email" required />
          </div>
          <PasswordField id="login-password" name="password" label="Contraseña" autoComplete="current-password" required />
          <button className={styles.submit} type="submit">{loading ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
        </fieldset>
        {(validation || error) && <p id="login-feedback" role="alert" className={styles.feedback}>{validation || error}</p>}
        {loading && <p role="status">Comprobando tus datos…</p>}
      </form>
    </AuthFormLayout>
  )
}
