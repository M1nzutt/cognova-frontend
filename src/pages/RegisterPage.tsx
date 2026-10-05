import { useState } from 'react'
import type { FormEvent } from 'react'
import { AuthFormLayout } from '../components/AuthFormLayout'
import styles from '../components/AuthFormLayout.module.css'
import { useAuth } from '../hooks/useAuth'
import { useAuthForm } from '../hooks/useAuthForm'
import { validateRegistration } from '../utils/authValidation'

export function RegisterPage() {
  const { session } = useAuth()
  const { loading, error, submit } = useAuthForm('/questionnaire')
  const [validation, setValidation] = useState<string | null>(null)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (key: string) => String(data.get(key) ?? '').trim()
    const details = {
      name: text('name'), email: text('email'), password: String(data.get('password') ?? ''),
      degree_program: text('degree_program'), semester: Number(text('semester')), academic_goal: text('academic_goal'),
    }
    const issue = validateRegistration(details)
    setValidation(issue)
    if (!issue) void submit((signal) => session.register(details, signal))
  }

  return (
    <AuthFormLayout title="Crea tu cuenta" description="Cuéntanos un poco sobre tu etapa académica. Todos los campos son obligatorios." alternative="¿Ya tienes cuenta?" linkText="Inicia sesión" linkTo="/login">
      <form className={styles.form} onSubmit={onSubmit} aria-busy={loading}>
        <fieldset className={styles.fieldset} disabled={loading}>
          <label className={styles.field}>Nombre
            <input className={styles.input} name="name" autoComplete="name" required />
          </label>
          <label className={styles.field}>Correo electrónico
            <input className={styles.input} name="email" type="email" autoComplete="email" required />
          </label>
          <label className={styles.field}>Contraseña
            <input className={styles.input} name="password" type="password" autoComplete="new-password" minLength={8} aria-describedby="password-hint" required />
            <span id="password-hint" className={styles.hint}>Al menos 8 caracteres.</span>
          </label>
          <label className={styles.field}>Carrera
            <input className={styles.input} name="degree_program" required />
          </label>
          <label className={styles.field}>Semestre
            <input className={styles.input} name="semester" type="number" min={1} step={1} inputMode="numeric" required />
          </label>
          <label className={styles.field}>Objetivo académico
            <textarea className={styles.input} name="academic_goal" rows={3} required />
          </label>
          <button className={`button ${styles.submit}`} type="submit">{loading ? 'Creando cuenta…' : 'Crear cuenta'}</button>
        </fieldset>
        {(validation || error) && <p role="alert" className={styles.feedback}>{validation || error}</p>}
        {loading && <p role="status">Estamos creando tu cuenta…</p>}
      </form>
    </AuthFormLayout>
  )
}
