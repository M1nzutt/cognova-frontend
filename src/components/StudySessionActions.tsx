import type { SessionExecutionState } from '../types/studySession'
import styles from './StudySessions.module.css'

interface Props {
  state: SessionExecutionState
  busy: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onFinish: () => void
}

export function StudySessionActions({ state, busy, onStart, onPause, onResume, onFinish }: Props) {
  return <section className={styles.panel} aria-label="Controles del temporizador">
    <div className={styles.actions}>
      {state === 'planned' && <button className={styles.primary} type="button" disabled={busy} onClick={onStart}>Iniciar sesión</button>}
      {state === 'running' && <button className="button" type="button" disabled={busy} onClick={onPause}>Pausar</button>}
      {state === 'paused' && <button className={styles.primary} type="button" disabled={busy} onClick={onResume}>Reanudar</button>}
      {(state === 'planned' || state === 'running' || state === 'paused') && <button className="button" type="button" disabled={busy} onClick={onFinish}>{state === 'planned' ? 'Postergar o cancelar' : 'Finalizar sesión'}</button>}
      {busy && <span role="status">Sincronizando con el servidor…</span>}
    </div>
  </section>
}
