import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAuthForm } from '../hooks/useAuthForm'
import { validateAcademicProfile } from '../utils/academicProfileValidation'
import styles from '../components/AuthFormLayout.module.css'

export function AcademicProfilePage() {
  const { user, session } = useAuth()
  const { loading, error, submit } = useAuthForm()
  const [validation, setValidation] = useState<string | null>(null)
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const profile = { degree_program: String(data.get('degree_program') ?? '').trim(), semester: Number(data.get('semester')) }
    const issue = validateAcademicProfile(profile)
    setValidation(issue)
    if (!issue) void submit(signal => session.saveAcademicProfile(profile, signal))
  }
  return <section className={styles.panel} aria-labelledby="profile-heading">
    <p className="eyebrow">PASO 1 DE 2 · TU ETAPA ACADÉMICA</p>
    <h1 id="profile-heading">Tu perfil académico</h1>
    <p>Cuéntanos qué estudias. Después exploraremos tu forma de estudiar.</p>
    <form onSubmit={save} className={styles.form} aria-busy={loading}>
      <fieldset className={styles.fieldset} disabled={loading}>
        <label className={styles.field}>Carrera<input className={styles.input} name="degree_program" defaultValue={user?.degree_program ?? ''} required /></label>
        <label className={styles.field}>Semestre<input className={styles.input} name="semester" type="number" min={1} max={2147483647} step={1} defaultValue={user?.semester ?? ''} required /></label>
        <button className="button" type="submit">{loading ? 'Guardando…' : 'Guardar y continuar'}</button>
      </fieldset>
      {(validation || error) && <p role="alert">{validation || error}</p>}
      {loading && <p role="status">Guardando tu perfil…</p>}
    </form>
  </section>
}
