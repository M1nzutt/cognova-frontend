import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { SubjectService } from '../services/SubjectService'
import { subjectError } from '../utils/subjectPresentation'
import type { Subject, SubjectCatalog, SubjectList, SubjectStatus } from '../types/subject'
export function useSubjectData(id?: number, status: SubjectStatus = 'active') {
  const { session } = useAuth()
  const service = useMemo(() => new SubjectService(session.api), [session])
  const [data, setData] = useState<{ catalog: SubjectCatalog; list: SubjectList; activeCount: number; item: Subject | null } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const [moreBusy, setMoreBusy] = useState(false)
  const more = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([service.catalog(controller.signal), service.list(status, undefined, controller.signal),
      status === 'active' ? Promise.resolve(null) : service.list('active', undefined, controller.signal),
      id === undefined ? Promise.resolve(null) : service.detail(id, controller.signal)])
      .then(([catalog, list, active, item]) => { if (!controller.signal.aborted) setData({ catalog, list, activeCount: (active ?? list).items.length, item }) })
      .catch(e => { if (!controller.signal.aborted) setError(subjectError(e)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => { controller.abort(); more.current?.abort() }
  }, [service, id, status, revision])
  const retry = useCallback(() => { setError(''); setLoading(true); setRevision(v => v + 1) }, [])
  async function loadMore() {
    if (!data?.list.next_after_id || more.current) return
    const controller = new AbortController(); more.current = controller; setMoreBusy(true); setError('')
    try {
      const page = await service.list(status, data.list.next_after_id, controller.signal)
      if (!controller.signal.aborted) setData(previous => previous ? { ...previous, list: { ...page, items: [...previous.list.items, ...page.items.filter(item => !previous.list.items.some(old => old.id === item.id))] } } : previous)
    } catch (e) { if (!controller.signal.aborted) setError(subjectError(e)) }
    finally { more.current = null; if (!controller.signal.aborted) setMoreBusy(false) }
  }
  function setItem(item: Subject) { setData(previous => previous ? { ...previous, item, activeCount: previous.activeCount + (previous.item?.status === item.status ? 0 : item.status === 'active' ? 1 : -1) } : previous) }
  return { service, data, error, loading, retry, loadMore, moreBusy, setItem }
}
