import { useEffect, useState } from 'react'
import { activityError } from '../utils/activityPresentation'
export function useActivityResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0)
  useEffect(() => {
    const c = new AbortController()
    load(c.signal).then(value => { if (!c.signal.aborted) setData(value) }).catch(e => { if (!c.signal.aborted) setError(activityError(e)) }).finally(() => { if (!c.signal.aborted) setLoading(false) })
    return () => c.abort()
  }, [load, revision])
  return { data, setData, error, loading, retry: () => { setError(''); setLoading(true); setRevision(r => r+1) } }
}
