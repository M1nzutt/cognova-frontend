import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/ApiError'

export function useAuthForm(destination: string) {
  const navigate = useNavigate()
  const pending = useRef<AbortController | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => { pending.current?.abort() }, [])

  const submit = async (request: (signal: AbortSignal) => Promise<void>) => {
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller
    setError(null)
    setLoading(true)
    try {
      await request(controller.signal)
      if (!controller.signal.aborted) navigate(destination, { replace: true })
    } catch (failure) {
      if (!controller.signal.aborted && !(failure instanceof DOMException && failure.name === 'AbortError')) {
        setError(failure instanceof ApiError ? failure.message : 'No pudimos completar la solicitud. Inténtalo de nuevo.')
      }
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return { loading, error, submit }
}
