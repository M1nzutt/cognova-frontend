import type { StudySession } from '../types/studySession'
import { localDateTime } from '../utils/studySessionPresentation'
import styles from './StudySessions.module.css'

export function StudySessionIntervals({ session }: { session: StudySession }) {
  if (!session.intervals.length) return null
  return <section className={styles.detail} aria-labelledby="session-intervals-title">
    <h2 id="session-intervals-title">Intervalos de ejecución</h2>
    <ol className={styles.intervals}>
      {session.intervals.map((interval, index) => <li key={interval.id}>
        <strong>Tramo {index + 1}</strong>: <time dateTime={interval.started_at}>{localDateTime(interval.started_at)}</time>
        {' — '}{interval.ended_at ? <time dateTime={interval.ended_at}>{localDateTime(interval.ended_at)}</time> : <span>En curso</span>}
      </li>)}
    </ol>
  </section>
}
