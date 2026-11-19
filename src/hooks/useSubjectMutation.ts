import { useEffect, useRef, useState } from 'react'
import { subjectError } from '../utils/subjectPresentation'
import { useGlobalFeedback } from '../feedback/GlobalFeedback'
export function useSubjectMutation() {
  const pending = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const feedback = useGlobalFeedback()
  useEffect(() => () => pending.current?.abort(), [])
  async function run<T>(operation: (signal: AbortSignal) => Promise<T>, success: (value: T) => void) {
    if (pending.current) return
    const controller = new AbortController(); pending.current = controller; setBusy(true); setError('')
    const feedbackId = feedback.publish({ kind: 'progress', title: 'Procesando solicitud', message: 'Cognova está realizando los cambios solicitados en tus materias.' })
    try {
      const value = await operation(controller.signal)
      if (!controller.signal.aborted) {
        success(value)
        feedback.update(feedbackId, { kind: 'success', title: 'Operación completada', message: 'Los cambios en tus materias se guardaron correctamente.' })
      }
    }
    catch (e) {
      if (!controller.signal.aborted) {
        setError(subjectError(e))
        feedback.update(feedbackId, { kind: 'error', title: 'No se completó la operación', message: 'Revisa el aviso de esta página y corrige o vuelve a intentarlo.' })
      }
    }
    finally { pending.current = null; if (!controller.signal.aborted) setBusy(false) }
  }
  return { busy, error, run, clearError: () => setError('') }
}
