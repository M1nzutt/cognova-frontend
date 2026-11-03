import { useEffect, useState } from 'react'
import type { StudySession } from '../types/studySession'
import { effectiveSeconds, formatDuration } from '../utils/studySessionPresentation'
import styles from './StudySessions.module.css'

export function StudySessionTimer({ session }: { session: StudySession }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (session.execution_state !== 'running') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [session.execution_state, session.id])
  const running = session.execution_state === 'running'
  return <section className={styles.panel} aria-labelledby="session-timer-title">
    <h2 id="session-timer-title">Tiempo efectivo</h2>
    <output className={styles.timer} aria-label={`Tiempo efectivo ${formatDuration(effectiveSeconds(session, now))}`} aria-live="off">
      {formatDuration(effectiveSeconds(session, now))}
    </output>
    <p className={styles.timerNote}>{running ? 'Estimación en curso; el servidor confirma el tiempo al pausar o finalizar.' : 'Tiempo acumulado confirmado por el servidor, sin contar pausas.'}</p>
  </section>
}
