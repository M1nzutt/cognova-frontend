import { useEffect, useState } from 'react'
import type { CalendarActivity, CalendarQuery } from '../types/calendar'
import type { CalendarService } from '../services/CalendarService'
import { calendarError } from '../utils/calendarError'
// The parent keys this resource by the full query; old responses cannot fill a new period.
export function useCalendarData(service: CalendarService, query: CalendarQuery) {
  const [state, setState] = useState<{ items: CalendarActivity[] | null; error: string }>({ items:null, error:'' })
  const [revision, setRevision] = useState(0)
  const serialized = JSON.stringify(query)
  useEffect(() => {
    const controller = new AbortController()
    void service.all(JSON.parse(serialized) as CalendarQuery, controller.signal).then(items => {
      if (!controller.signal.aborted) setState({ items, error:'' })
    }).catch(error => { if (!controller.signal.aborted) setState({ items:null, error:calendarError(error) }) })
    return () => controller.abort()
  }, [service, serialized, revision])
  return { ...state, retry: () => { setState({ items:null, error:'' }); setRevision(r => r+1) } }
}
