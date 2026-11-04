import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/ApiError'
import { planError } from '../utils/studyPlanPresentation'

export function useStudyPlanMutation() {
  const controllerRef = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => () => controllerRef.current?.abort(), [])

  async function run<T>(operation: (signal: AbortSignal) => Promise<T>, onSuccess: (value: T) => void, onConflict?: () => Promise<void>) {
    if (controllerRef.current) return
    const controller = new AbortController()
    controllerRef.current = controller
    setBusy(true)
    setError('')
    try {
      const result = await operation(controller.signal)
      if (!controller.signal.aborted) onSuccess(result)
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(planError(reason))
        if (reason instanceof ApiError && reason.status === 409 && onConflict) await onConflict().catch(() => undefined)
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  return { busy, error, run, clearError: () => setError('') }
}
