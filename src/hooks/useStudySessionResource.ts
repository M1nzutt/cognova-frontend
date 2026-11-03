import { useCallback, useEffect, useState } from 'react'
import { studySessionError } from '../utils/studySessionPresentation'

export function useStudySessionResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [snapshot, setSnapshot] = useState<{ revision: number; data: T | null; error: string } | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(value => { if (!controller.signal.aborted) setSnapshot({ revision, data: value, error: '' }) })
      .catch(reason => { if (!controller.signal.aborted) setSnapshot({ revision, data: null, error: studySessionError(reason) }) })
    return () => controller.abort()
  }, [load, revision])
  const current = snapshot?.revision === revision ? snapshot : null
  const setData = useCallback((next: T | null | ((previous: T | null) => T | null)) => {
    setSnapshot(previous => {
      const old = previous?.revision === revision ? previous.data : null
      const value = typeof next === 'function' ? (next as (previous: T | null) => T | null)(old) : next
      return value === null ? null : { revision, data: value, error: '' }
    })
  }, [revision])
  const retry = useCallback(() => setRevision(value => value + 1), [])
  return {
    data: current?.data ?? null,
    setData,
    error: current?.error ?? '',
    loading: current === null,
    retry,
  }
}
