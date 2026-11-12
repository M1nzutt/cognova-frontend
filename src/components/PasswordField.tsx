import { useState } from 'react'
import styles from './PasswordField.module.css'

interface Props {
  id: string
  name: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  required?: boolean
  minLength?: number
  maxLength?: number
  hint?: string
}

export function PasswordField({ id, name, label, autoComplete, required, minLength, maxLength, hint }: Props) {
  const [visible, setVisible] = useState(false)
  const hintId = `${id}-hint`

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <span className={styles.control}>
        <input
          id={id}
          className={styles.input}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          aria-describedby={hint ? hintId : undefined}
          required={required}
        />
        <button
          className={styles.toggle}
          type="button"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </span>
      {hint && <span className={styles.hint} id={hintId}>{hint}</span>}
    </div>
  )
}
