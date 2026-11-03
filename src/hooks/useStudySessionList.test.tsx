import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { StudySessionFilters } from '../types/studySession'
import type { StudySessionService } from '../services/StudySessionService'
import { useStudySessionList } from './useStudySessionList'
import { sessionSummary } from '../test/studySessionFixtures'

function Harness({ service }: { service: StudySessionService }) {
  const [subject, setSubject] = useState(1)
  const query = useStudySessionList(service, { subject_id: subject })
  return <>
    <button onClick={() => setSubject(2)}>Cambiar filtro</button>
    {query.loading && <span role="status">Cargando sesiones…</span>}
    {query.error && <p role="alert">{query.error}</p>}
    {query.data?.items.map(item => <p key={item.id}>{item.id === 8 ? 'Plan A' : 'Plan B'}</p>)}
    {query.data?.active && <p>Sesión activa recuperada</p>}
    {query.data?.cursor && <button disabled={query.loadingMore} onClick={() => void query.loadMore()}>Cargar más</button>}
    <button onClick={query.retry}>Reintentar</button>
  </>
}

const base = { ...sessionSummary, planned_start_at: '2030-01-15T15:00:00Z' }
const asService = (value: object) => value as unknown as StudySessionService

describe('study session list resource', () => {
  it('loads an initial page and recovers an active session from the API', async () => {
    const active = { ...base, execution_state: 'paused' as const, start_at: '2030-01-15T15:05:00Z', intervals: [{ id: 1, started_at: '2030-01-15T15:05:00Z', ended_at: '2030-01-15T15:10:00Z' }] }
    const service = asService({ list: vi.fn().mockResolvedValue({ items: [base], next_cursor: null }), listActive: vi.fn().mockResolvedValue(active) })
    render(<Harness service={service} />)
    expect(await screen.findByText('Plan A')).toBeVisible()
    expect(screen.getByText('Sesión activa recuperada')).toBeVisible()
  })

  it('discards stale responses and items when a filter changes', async () => {
    let oldResolve!: (value: unknown) => void
    const service = asService({
      list: vi.fn((filters: StudySessionFilters) => filters.subject_id === 1
        ? new Promise(resolve => { oldResolve = resolve })
        : Promise.resolve({ items: [{ ...base, id: 9 }], next_cursor: null })),
      listActive: vi.fn().mockResolvedValue(null),
    })
    render(<Harness service={service} />)
    await waitFor(() => expect(oldResolve).toBeTypeOf('function'))
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar filtro' }))
    expect(await screen.findByText('Plan B')).toBeVisible()
    expect(screen.queryByText('Plan A')).not.toBeInTheDocument()
    await act(async () => oldResolve({ items: [base], next_cursor: null }))
    expect(screen.getByText('Plan B')).toBeVisible()
    expect(screen.queryByText('Plan A')).not.toBeInTheDocument()
  })

  it('loads cursor pages without reordering', async () => {
    const first = { ...base, id: 8, planned_start_at: '2030-01-15T15:00:00Z' }
    const second = { ...base, id: 9, planned_start_at: '2030-01-16T15:00:00Z' }
    const service = asService({
      list: vi.fn().mockResolvedValueOnce({ items: [first], next_cursor: { after_planned_start_at: first.planned_start_at, after_id: first.id } }).mockResolvedValueOnce({ items: [second], next_cursor: null }),
      listActive: vi.fn().mockResolvedValue(null),
    })
    render(<Harness service={service} />)
    await screen.findByText('Plan A')
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }))
    expect(await screen.findByText('Plan B')).toBeVisible()
    expect(service.list).toHaveBeenCalledTimes(2)
  })
})
