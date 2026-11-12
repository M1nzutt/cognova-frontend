import { Link } from 'react-router-dom'
import styles from './WelcomePage.module.css'

const studyDays = [
  { label: 'L', date: '10', active: false },
  { label: 'M', date: '11', active: true },
  { label: 'X', date: '12', active: false },
  { label: 'J', date: '13', active: false },
  { label: 'V', date: '14', active: false },
  { label: 'S', date: '15', active: false },
  { label: 'D', date: '16', active: false },
]

const previewSessions = [
  { time: '09:00', subject: 'Física', detail: 'Repaso de movimiento', duration: '45 min', tone: 'lilac' },
  { time: '13:30', subject: 'Proyecto', detail: 'Avance de investigación', duration: '1 h', tone: 'sage' },
  { time: '17:00', subject: 'Álgebra', detail: 'Ejercicios de práctica', duration: '30 min', tone: 'sand' },
]

const values = [
  { number: '01', title: 'Organiza', description: 'Pon tus materias y objetivos en una ruta clara.' },
  { number: '02', title: 'Registra', description: 'Anota lo que pasa mientras estudias, a tu ritmo.' },
  { number: '03', title: 'Comprende', description: 'Encuentra contexto en tu recorrido y decide qué sigue.' },
]

export function WelcomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="welcome-title">
        <div className={styles.heroCopy}>
          <p className="eyebrow">ESTUDIO CON PERSPECTIVA</p>
          <h1 id="welcome-title" className={styles.title}>Estudia con más claridad, <span>a tu manera.</span></h1>
          <p className={styles.intro}>Organiza lo que quieres hacer, registra lo que ocurre y comprende mejor tu forma de estudiar.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} to="/register">Crear mi cuenta</Link>
            <a className={styles.secondaryAction} href="#como-funciona">Conocer cómo funciona <span aria-hidden="true">↓</span></a>
          </div>
          <p className={styles.reassurance}>Tu recorrido es personal. Las decisiones siempre son tuyas.</p>
        </div>

        <figure className={styles.productPreview} aria-labelledby="preview-caption">
          <div className={styles.previewTopline}>
            <span className={styles.previewLabel}><span className={styles.previewDot} /> VISTA PREVIA</span>
            <span className={styles.previewPeriod}>10 — 16 nov</span>
          </div>
          <div className={styles.previewHeading}>
            <div>
              <p>Tu semana</p>
              <h2>Un paso a la vez.</h2>
            </div>
            <span className={styles.weekCount}>3 sesiones</span>
          </div>
          <div className={styles.weekStrip} aria-hidden="true">
            {studyDays.map((day) => (
              <span className={day.active ? styles.activeDay : ''} key={day.date}>
                <small>{day.label}</small><b>{day.date}</b>
              </span>
            ))}
          </div>
          <div className={styles.sessionList}>
            {previewSessions.map((session) => (
              <article className={styles.sessionRow} key={session.subject}>
                <time>{session.time}</time>
                <span className={`${styles.sessionMark} ${styles[session.tone]}`} aria-hidden="true" />
                <div className={styles.sessionDetails}>
                  <strong>{session.subject}</strong>
                  <span>{session.detail}</span>
                </div>
                <span className={styles.duration}>{session.duration}</span>
              </article>
            ))}
          </div>
          <figcaption id="preview-caption" className={styles.previewCaption}>Ejemplo de organización semanal en Cognova</figcaption>
        </figure>
      </section>

      <section className={styles.values} aria-labelledby="values-title">
        <div className={styles.sectionIntro}>
          <p className="eyebrow">TU PROCESO, CON MÁS CONTEXTO</p>
          <h2 id="values-title">Una forma más consciente de estudiar.</h2>
        </div>
        <div className={styles.valueList}>
          {values.map((value) => (
            <article className={styles.value} key={value.number}>
              <span>{value.number}</span>
              <div><h3>{value.title}</h3><p>{value.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.reflection} id="como-funciona" aria-labelledby="reflection-title">
        <div className={styles.reflectionCopy}>
          <p className="eyebrow">INTELIGENCIA CON CRITERIO</p>
          <h2 id="reflection-title">Una IA que observa y pregunta. Tú eliges.</h2>
          <p>Cognova relaciona señales de tu recorrido para ayudarte a mirar tu proceso desde otra perspectiva. No decide por ti ni reemplaza tu criterio.</p>
          <p className={styles.reflectionPrinciple}>La tecnología aporta contexto; tú interpretas y decides.</p>
        </div>
        <aside className={styles.example} aria-label="Ejemplo de reflexión con evidencia">
          <p className={styles.exampleLabel}>EJEMPLO DE REFLEXIÓN</p>
          <div className={styles.observation}>
            <span>OBSERVACIÓN</span>
            <p>Has aplazado Física varias veces esta semana.</p>
          </div>
          <div className={styles.evidence}>
            <span className={styles.evidenceTick} aria-hidden="true">✓</span>
            <p><strong>Evidencia</strong><br />3 aplazamientos registrados</p>
          </div>
          <div className={styles.question}>
            <span>PREGUNTA</span>
            <p>¿Qué hace más difícil empezar?</p>
          </div>
          <div className={styles.exampleFooter}>
            <span>Una invitación a reflexionar</span>
            <span className={styles.decisionTag}>TÚ DECIDES</span>
          </div>
        </aside>
      </section>
    </div>
  )
}
