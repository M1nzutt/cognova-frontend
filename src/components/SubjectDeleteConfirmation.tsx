import { useEffect, useRef, useState } from 'react'
import styles from './Subjects.module.css'
export function SubjectDeleteConfirmation({ name, busy, error, onCancel, onConfirm }: { name: string; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close() }, [])
  const cancel = () => { dialog.current?.close(); onCancel() }
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="delete-title" aria-describedby="delete-warning" onCancel={event => { event.preventDefault(); if (!busy) cancel() }}>
    <h2 id="delete-title">Eliminar «{name}»</h2>
    <p id="delete-warning">Esta acción es permanente. No podrás recuperar esta materia. Si quieres conservarla para después, cancela y elige archivar.</p>
    <label className={styles.confirm}><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />Entiendo que la eliminación es irreversible.</label>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className="actions"><button className="button" type="button" autoFocus disabled={busy} onClick={cancel}>Cancelar</button><button className={styles.danger} type="button" disabled={!confirmed || busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</button></div>
  </dialog>
}
