import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/ApiError'
import type { StudySession, StudySessionCursor, StudySessionFilters, StudySessionSummary } from '../types/studySession'
import type { StudySessionService } from '../services/StudySessionService'
import { studySessionError } from '../utils/studySessionPresentation'

interface Snapshot {
  key: string
  items: StudySessionSummary[]
  cursor: StudySessionCursor | null
  active: StudySession | null
}

function orderedAfter(previous: StudySessionSummary, next: StudySessionSummary): boolean {
  const time = Date.parse(next.planned_start_at) - Date.parse(previous.planned_start_at)
  return time > 0 || time === 0 && next.id > previous.id
}

export function useStudySessionList(service: StudySessionService, filters: StudySessionFilters) {
  const key = JSON.stringify(filters)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [revision, setRevision] = useState(0)
  const more = useRef<AbortController | null>(null)
  const pendingMore = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    Promise.all([service.list(JSON.parse(key) as StudySessionFilters, undefined, controller.signal), service.listActive(controller.signal)])
      .then(([page, active]) => {
        if (!controller.signal.aborted) setSnapshot({ key, items: page.items, cursor: page.next_cursor, active })
      })
      .catch(reason => { if (!controller.signal.aborted) { setSnapshot(previous => previous?.key === key ? previous : null); setError(studySessionError(reason)) } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => { controller.abort(); more.current?.abort(); more.current = null; pendingMore.current = false }
  }, [service, key, revision])

  const loadMore = useCallback(async () => {
    const current = snapshot?.key === key ? snapshot : null
    if (!current?.cursor || pendingMore.current) return
    const controller = new AbortController()
    more.current = controller
    pendingMore.current = true
    setLoadingMore(true)
    setError('')
    try {
      const page = await service.list(JSON.parse(key) as StudySessionFilters, current.cursor, controller.signal)
      controller.signal.throwIfAborted()
      const previousLast = current.items.at(-1), nextFirst = page.items[0]
      if (previousLast && nextFirst && !orderedAfter(previousLast, nextFirst)) throw new ApiError('Respuesta de sesiones fuera de orden.', 0, 'INVALID_RESPONSE')
      setSnapshot(previous => previous?.key === key ? { ...previous, items: [...previous.items, ...page.items], cursor: page.next_cursor } : previous)
    } catch (reason) {
      if (!controller.signal.aborted) setError(studySessionError(reason))
    } finally {
      if (more.current === controller) more.current = null
      pendingMore.current = false
      if (!controller.signal.aborted) setLoadingMore(false)
    }
  }, [key, service, snapshot])

  const retry = useCallback(() => { setError(''); setLoading(true); setRevision(value => value + 1) }, [])
  const data = snapshot?.key === key ? snapshot : null
  return { data, error, loading: loading || data === null, loadingMore, loadMore, retry }
}
