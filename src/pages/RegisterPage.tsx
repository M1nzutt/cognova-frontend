import { useState } from 'react'
import type { FormEvent } from 'react'
import { AuthFormLayout } from '../components/AuthFormLayout'
import { PasswordField } from '../components/PasswordField'
import styles from '../components/PublicAuthForm.module.css'
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
    <AuthFormLayout
      title="Crea tu cuenta"
      description="Empieza con tus datos de acceso. Después podrás contarnos sobre tu etapa académica."
      alternative="¿Ya tienes cuenta?"
      linkText="Inicia sesión"
      linkTo="/login"
      contextLabel="TU ESPACIO EMPIEZA AQUÍ"
      storyTitle="Un buen proceso empieza por conocerte."
      storyDescription="Cognova reúne tus objetivos y registros para que construyas, poco a poco, una forma de estudiar que tenga sentido para ti."
    >
      <form className={styles.form} onSubmit={onSubmit} aria-busy={loading}>
        <fieldset className={styles.fieldset} disabled={loading}>
          <div className={styles.field}>
            <label htmlFor="register-name">Nombre</label>
            <input id="register-name" className={styles.input} name="name" autoComplete="name" maxLength={30} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="register-email">Correo electrónico</label>
            <input id="register-email" className={styles.input} name="email" type="email" autoComplete="email" maxLength={50} required />
          </div>
          <PasswordField
            id="register-password"
            name="password"
            label="Contraseña"
            autoComplete="new-password"
            minLength={8}
            maxLength={12}
            hint="Entre 8 y 12 caracteres."
            required
          />
          <button className={styles.submit} type="submit">{loading ? 'Creando cuenta…' : 'Crear cuenta'}</button>
        </fieldset>
        {(validation || error) && <p id="register-feedback" role="alert" className={styles.feedback}>{validation || error}</p>}
        {loading && <p role="status">Estamos creando tu cuenta…</p>}
      </form>
    </AuthFormLayout>
  )
}
