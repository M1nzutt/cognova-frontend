import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import styles from './PublicAuthLayout.module.css'

interface Props {
  title: string
  description: string
  alternative: string
  linkText: string
  linkTo: string
  contextLabel: string
  storyTitle: string
  storyDescription: string
  children: ReactNode
}

export function AuthFormLayout({ title, description, alternative, linkText, linkTo, contextLabel, storyTitle, storyDescription, children }: Props) {
  return (
    <div className={styles.layout}>
      <aside className={styles.story} aria-labelledby="auth-story-title">
        <div className={styles.storyBrand}>
          <span className={styles.storyMark} aria-hidden="true"><Icon name="orbit" size={27} /></span>
          <span>Cognova</span>
        </div>
        <p className={styles.storyEyebrow}>APRENDER TAMBIÉN ES OBSERVAR</p>
        <h2 id="auth-story-title">{storyTitle}</h2>
        <p className={styles.storyDescription}>{storyDescription}</p>
        <div className={styles.storyPath} aria-label="Planear, estudiar, reflexionar">
          <span><b>01</b> Planear</span>
          <i aria-hidden="true" />
          <span><b>02</b> Estudiar</span>
          <i aria-hidden="true" />
          <span><b>03</b> Reflexionar</span>
        </div>
        <div className={styles.orbitArt} aria-hidden="true"><span /><span /><i /></div>
      </aside>

      <section className={styles.panel} aria-labelledby="auth-title">
        <p className="eyebrow">{contextLabel}</p>
        <h1 id="auth-title">{title}</h1>
        <p className={styles.description}>{description}</p>
        {children}
        <p className={styles.alternative}><span>{alternative}</span> <Link to={linkTo}>{linkText}</Link></p>
      </section>
    </div>
  )
}
