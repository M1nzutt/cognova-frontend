import { ApiClient } from '../api/client'
import { ApiError } from '../api/ApiError'
import type { CalendarActivity, CalendarCursor, CalendarQuery } from '../types/calendar'
import { calendarInvalid, compareCalendar, instantMicros, readCalendar } from '../utils/readCalendar'

export class CalendarService {
  constructor(private readonly client: ApiClient) {}
  async page(query: CalendarQuery, cursor?: CalendarCursor, signal?: AbortSignal) {
    const from = instantMicros(query.deadline_from), to = instantMicros(query.deadline_to)
    if (to <= from || to - from > 366n * 86400000000n) throw new ApiError('Selecciona un periodo de hasta un año.', 422)
    const page = readCalendar(await this.client.request('/calendar', {
      signal, query: { ...query, limit: 50, ...(cursor ?? {}) },
    }))
    if (page.items.some(item => instantMicros(item.deadline) < from || instantMicros(item.deadline) >= to
      || cursor && compareCalendar(item, { deadline: cursor.after_deadline, id: cursor.after_id }) <= 0)) return calendarInvalid()
    return page
  }
  async all(query: CalendarQuery, signal: AbortSignal) {
    const items: CalendarActivity[] = [], seen = new Set<string>()
    let cursor: CalendarCursor | undefined
    do {
      signal.throwIfAborted()
      const page = await this.page(query, cursor, signal)
      for (const item of page.items) {
        const key = item.type + ':' + item.id
        if (seen.has(key)) return calendarInvalid()
        seen.add(key); items.push(item)
      }
      cursor = page.next_cursor ?? undefined
    } while (cursor)
    return items
  }
}
