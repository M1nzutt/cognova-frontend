import { useEffect, useState } from 'react'
import { studySessionError } from '../utils/studySessionPresentation'

export function useStudySessionResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    load(controller.signal).then(value => { if (!controller.signal.aborted) setData(value) })
      .catch(reason => { if (!controller.signal.aborted) setError(studySessionError(reason)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [load, revision])
  return {
    data,
    setData,
    error,
    loading,
    retry: () => setRevision(value => value + 1),
  }
}
