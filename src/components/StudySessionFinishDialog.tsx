import { useEffect, useRef, useState } from 'react'
import type { SessionContext, SessionResult, StudySession, StudySessionFinish } from '../types/studySession'
import { sessionContextLabels, sessionResultLabels } from '../utils/studySessionPresentation'
import styles from './StudySessions.module.css'

export function StudySessionFinishDialog({ session, busy, error, onCancel, onConfirm }: {
  session: StudySession; busy: boolean; error: string; onCancel: () => void; onConfirm: (value: StudySessionFinish) => void
}) {
  const executed = session.start_at !== null
  const allowedResults: SessionResult[] = executed ? ['completed', 'partial'] : ['postponed', 'cancelled']
  const [result, setResult] = useState<SessionResult>(executed ? 'completed' : 'postponed')
  const [context, setContext] = useState<SessionContext | ''>('')
  const [otherText, setOtherText] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [validation, setValidation] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  function cancel() { if (!busy) { dialog.current?.close(); onCancel() } }
  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!confirmed) { setValidation('Confirma que deseas cerrar esta sesión con el resultado seleccionado.'); return }
    if (!allowedResults.includes(result)) { setValidation('Selecciona un resultado permitido para el estado actual.'); return }
    if (otherText.length > 200) { setValidation('El texto puede tener hasta 200 caracteres.'); return }
    setValidation('')
    onConfirm({ status: result, context: context || null, other_text: context === 'other' ? otherText.trim() || null : null })
  }
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="session-finish-title" aria-describedby="session-finish-warning" onCancel={event => { event.preventDefault(); cancel() }}>
    <form onSubmit={submit} noValidate>
      <h2 id="session-finish-title">{executed ? 'Finalizar sesión' : 'Cerrar plan de sesión'}</h2>
      <p id="session-finish-warning">{executed ? 'El temporizador se sincronizará con el servidor y la sesión quedará cerrada.' : 'La sesión se cerrará sin tiempo de ejecución. Elige Postergada o Cancelada.'}</p>
      <fieldset disabled={busy} className={styles.form}>
        <label htmlFor="session-result">Resultado</label>
        <select id="session-result" value={result} onChange={event => setResult(event.target.value as SessionResult)}>
          {allowedResults.map(value => <option key={value} value={value}>{sessionResultLabels[value]}</option>)}
        </select>
        {executed && <>
          <label htmlFor="session-context">¿Cómo terminó? (opcional)</label>
          <select id="session-context" value={context} onChange={event => setContext(event.target.value as SessionContext | '')}>
            <option value="">Sin contexto</option>
            {Object.entries(sessionContextLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {context === 'other' && <>
            <label htmlFor="session-other-text">Cuéntanos brevemente (opcional)</label>
            <textarea id="session-other-text" maxLength={200} value={otherText} onChange={event => setOtherText(event.target.value)} aria-describedby="session-other-count" />
            <small id="session-other-count">{[...otherText].length}/200 caracteres</small>
          </>}
        </>}
      </fieldset>
      <label className={styles.confirm}><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} />Confirmo que deseo finalizar con este resultado.</label>
      {(validation || error) && <p role="alert" className={styles.error}>{validation || error}</p>}
      <div className={styles.actions}>
        <button className="button" type="button" autoFocus disabled={busy} onClick={cancel}>Volver</button>
        <button className={styles.primary} type="submit" disabled={busy || !confirmed}>{busy ? 'Guardando…' : 'Confirmar resultado'}</button>
      </div>
    </form>
  </dialog>
}
