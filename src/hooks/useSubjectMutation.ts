import { useEffect, useRef, useState } from 'react'
import { subjectError } from '../utils/subjectPresentation'
export function useSubjectMutation() {
  const pending = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => () => pending.current?.abort(), [])
  async function run<T>(operation: (signal: AbortSignal) => Promise<T>, success: (value: T) => void) {
    if (pending.current) return
    const controller = new AbortController(); pending.current = controller; setBusy(true); setError('')
    try { const value = await operation(controller.signal); if (!controller.signal.aborted) success(value) }
    catch (e) { if (!controller.signal.aborted) setError(subjectError(e)) }
    finally { pending.current = null; if (!controller.signal.aborted) setBusy(false) }
  }
  return { busy, error, run, clearError: () => setError('') }
}
