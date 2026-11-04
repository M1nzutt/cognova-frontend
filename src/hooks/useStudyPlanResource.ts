import { useCallback, useEffect, useState } from 'react'
import { planError } from '../utils/studyPlanPresentation'

export function useStudyPlanResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [snapshot, setSnapshot] = useState<{ revision: number; data: T | null; error: string } | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
      .then(data => { if (!controller.signal.aborted) setSnapshot({ revision, data, error: '' }) })
      .catch(error => { if (!controller.signal.aborted) setSnapshot({ revision, data: null, error: planError(error) }) })
    return () => controller.abort()
  }, [load, revision])
  const current = snapshot?.revision === revision ? snapshot : null
  const retry = useCallback(() => setRevision(value => value + 1), [])
  const setData = useCallback((next: T | ((previous: T | null) => T | null)) => {
    setSnapshot(previous => {
      const old = previous?.revision === revision ? previous.data : null
      const data = typeof next === 'function' ? (next as (previous: T | null) => T | null)(old) : next
      return data === null ? null : { revision, data, error: '' }
    })
  }, [revision])
  return { data: current?.data ?? null, loading: current === null, error: current?.error ?? '', retry, setData }
}
