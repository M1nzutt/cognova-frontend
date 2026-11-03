import { useEffect, useRef, useState } from 'react'
import styles from './StudySessions.module.css'

export function StudySessionDeleteConfirmation({ busy, error, onCancel, onConfirm }: { busy: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  const cancel = () => { if (!busy) { dialog.current?.close(); onCancel() } }
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="session-delete-title" aria-describedby="session-delete-warning" onCancel={event => { event.preventDefault(); cancel() }}>
    <h2 id="session-delete-title">Eliminar plan de sesión</h2>
    <p id="session-delete-warning">Solo se eliminan planes que nunca empezaron. Una sesión con ejecución conserva sus intervalos e historial.</p>
    <label className={styles.confirm}><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} />Entiendo que la eliminación del plan es permanente.</label>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.actions}>
      <button className="button" type="button" autoFocus disabled={busy} onClick={cancel}>Conservar plan</button>
      <button className={styles.danger} type="button" disabled={!confirmed || busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Eliminar plan'}</button>
    </div>
  </dialog>
}
