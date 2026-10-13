import { useState } from 'react'
import type { FormEvent } from 'react'
import { AuthFormLayout } from '../components/AuthFormLayout'
import styles from '../components/AuthFormLayout.module.css'
import { useAuth } from '../hooks/useAuth'
import { useAuthForm } from '../hooks/useAuthForm'
import { validateRegistration } from '../utils/authValidation'

export function RegisterPage() {
  const { session } = useAuth()
  const { loading, error, submit } = useAuthForm()
  const [validation, setValidation] = useState<string | null>(null)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (key: string) => String(data.get(key) ?? '').trim()
    const details = {
      name: text('name'), email: text('email'), password: String(data.get('password') ?? ''),
    }
    const issue = validateRegistration(details)
    setValidation(issue)
    if (!issue) void submit((signal) => session.register(details, signal))
  }

  return (
    <AuthFormLayout title="Crea tu cuenta" description="Comienza con tus datos de acceso. Después conoceremos tu etapa académica." alternative="¿Ya tienes cuenta?" linkText="Inicia sesión" linkTo="/login">
      <form className={styles.form} onSubmit={onSubmit} aria-busy={loading}>
        <fieldset className={styles.fieldset} disabled={loading}>
          <label className={styles.field}>Nombre
            <input className={styles.input} name="name" autoComplete="name" maxLength={30} required />
          </label>
          <label className={styles.field}>Correo electrónico
            <input className={styles.input} name="email" type="email" autoComplete="email" maxLength={50} required />
          </label>
          <label className={styles.field}>Contraseña
            <input className={styles.input} name="password" type="password" autoComplete="new-password" minLength={8} maxLength={12} aria-describedby="password-hint" required />
            <span id="password-hint" className={styles.hint}>Entre 8 y 12 caracteres.</span>
          </label>
          <button className={`button ${styles.submit}`} type="submit">{loading ? 'Creando cuenta…' : 'Crear cuenta'}</button>
        </fieldset>
        {(validation || error) && <p role="alert" className={styles.feedback}>{validation || error}</p>}
        {loading && <p role="status">Estamos creando tu cuenta…</p>}
      </form>
    </AuthFormLayout>
  )
}
