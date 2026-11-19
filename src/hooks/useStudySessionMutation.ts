import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/ApiError'
import { studySessionError } from '../utils/studySessionPresentation'
import { useGlobalFeedback } from '../feedback/GlobalFeedback'

export function useStudySessionMutation() {
  const controllerRef = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const feedback = useGlobalFeedback()
  useEffect(() => () => controllerRef.current?.abort(), [])
  async function run<T>(operation: (signal: AbortSignal) => Promise<T>, onSuccess: (value: T) => void, options: { conflictMessage?: string; onConflict?: () => Promise<void> } = {}) {
    if (controllerRef.current) return
    const controller = new AbortController()
    controllerRef.current = controller
    setBusy(true)
    setError('')
    const feedbackId = feedback.publish({ kind: 'progress', title: 'Procesando sesión', message: 'Cognova está sincronizando la acción solicitada.' })
    try {
      const value = await operation(controller.signal)
      if (!controller.signal.aborted) {
        onSuccess(value)
        feedback.update(feedbackId, { kind: 'success', title: 'Sesión procesada', message: 'La acción de la sesión se completó correctamente.' })
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof ApiError && reason.status === 409 && options.conflictMessage ? options.conflictMessage : studySessionError(reason))
        feedback.update(feedbackId, { kind: 'error', title: 'No se completó la acción de la sesión', message: 'Revisa el aviso de esta página y actualiza la sesión antes de volver a intentarlo.' })
        if (reason instanceof ApiError && reason.status === 409 && options.onConflict) await options.onConflict().catch(() => undefined)
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  return { busy, error, run, clearError: () => setError('') }
}
