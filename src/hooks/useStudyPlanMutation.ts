import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/ApiError'
import { planError } from '../utils/studyPlanPresentation'
import { useGlobalFeedback } from '../feedback/GlobalFeedback'

export function useStudyPlanMutation() {
  const controllerRef = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const feedback = useGlobalFeedback()
  useEffect(() => () => controllerRef.current?.abort(), [])

  async function run<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    onSuccess: (value: T) => void,
    onConflict?: () => Promise<void>,
    feedbackEnabled = true,
  ) {
    if (controllerRef.current) return
    const controller = new AbortController()
    controllerRef.current = controller
    setBusy(true)
    setError('')
    const feedbackId = feedbackEnabled
      ? feedback.publish({ kind: 'progress', title: 'Procesando solicitud', message: 'Cognova está realizando los cambios solicitados en tu plan o reto.' })
      : null
    try {
      const result = await operation(controller.signal)
      if (!controller.signal.aborted) {
        onSuccess(result)
        if (feedbackId) feedback.update(feedbackId, { kind: 'success', title: 'Operación completada', message: 'La acción sobre tu plan o reto se completó correctamente.' })
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(planError(reason))
        if (feedbackId) feedback.update(feedbackId, { kind: 'error', title: 'No se completó la operación', message: 'Revisa el aviso de esta página y corrige o vuelve a intentarlo.' })
        if (reason instanceof ApiError && reason.status === 409 && onConflict) await onConflict().catch(() => undefined)
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  return { busy, error, run, clearError: () => setError('') }
}
