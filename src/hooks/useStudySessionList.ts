import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/ApiError'
import type { StudySession, StudySessionCursor, StudySessionFilters, StudySessionSummary } from '../types/studySession'
import type { StudySessionService } from '../services/StudySessionService'
import { studySessionError } from '../utils/studySessionPresentation'

interface Snapshot {
  key: string
  revision: number
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
  const [errorState, setErrorState] = useState<{ key: string; revision: number; message: string } | null>(null)
  const [loadingMoreState, setLoadingMoreState] = useState<{ key: string; revision: number } | null>(null)
  const [revision, setRevision] = useState(0)
  const more = useRef<AbortController | null>(null)
  const pendingMore = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([service.list(JSON.parse(key) as StudySessionFilters, undefined, controller.signal), service.listActive(controller.signal)])
      .then(([page, active]) => {
        if (!controller.signal.aborted) setSnapshot({ key, revision, items: page.items, cursor: page.next_cursor, active })
      })
      .catch(reason => { if (!controller.signal.aborted) setErrorState({ key, revision, message: studySessionError(reason) }) })
    return () => { controller.abort(); more.current?.abort(); more.current = null; pendingMore.current = false }
  }, [service, key, revision])

  const loadMore = useCallback(async () => {
    const current = snapshot?.key === key && snapshot.revision === revision ? snapshot : null
    if (!current?.cursor || pendingMore.current) return
    const controller = new AbortController()
    more.current = controller
    pendingMore.current = true
    setLoadingMoreState({ key, revision })
    setErrorState(null)
    try {
      const page = await service.list(JSON.parse(key) as StudySessionFilters, current.cursor, controller.signal)
      controller.signal.throwIfAborted()
      const previousLast = current.items.at(-1), nextFirst = page.items[0]
      if (previousLast && nextFirst && !orderedAfter(previousLast, nextFirst)) throw new ApiError('Respuesta de sesiones fuera de orden.', 0, 'INVALID_RESPONSE')
      setSnapshot(previous => previous?.key === key && previous.revision === revision ? { ...previous, items: [...previous.items, ...page.items], cursor: page.next_cursor } : previous)
    } catch (reason) {
      if (!controller.signal.aborted) setErrorState({ key, revision, message: studySessionError(reason) })
    } finally {
      if (more.current === controller) more.current = null
      pendingMore.current = false
      if (!controller.signal.aborted) setLoadingMoreState(null)
    }
  }, [key, revision, service, snapshot])

  const retry = useCallback(() => setRevision(value => value + 1), [])
  const current = snapshot?.key === key && snapshot.revision === revision ? snapshot : null
  const error = errorState?.key === key && errorState.revision === revision ? errorState.message : ''
  const loadingMore = loadingMoreState?.key === key && loadingMoreState.revision === revision
  return { data: current, error, loading: current === null && !error, loadingMore, loadMore, retry }
}
