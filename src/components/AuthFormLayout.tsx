import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './AuthFormLayout.module.css'

interface Props {
  title: string
  description: string
  alternative: string
  linkText: string
  linkTo: string
  children: ReactNode
}

export function AuthFormLayout({ title, description, alternative, linkText, linkTo, children }: Props) {
  return (
    <section className={styles.panel} aria-labelledby="auth-title">
      <p className="eyebrow">TU RECORRIDO ACADÉMICO</p>
      <h1 id="auth-title">{title}</h1>
      <p className={styles.description}>{description}</p>
      {children}
      <p className={styles.alternative}>{alternative} <Link to={linkTo}>{linkText}</Link></p>
    </section>
  )
}
