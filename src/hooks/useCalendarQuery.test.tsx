import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { expect, it } from 'vitest'
import { useCalendarQuery } from './useCalendarQuery'
import { dayKey } from '../utils/calendarDates'
function Probe() { const q = useCalendarQuery(), location = useLocation(); return <><p>{dayKey(q.date)} / {q.view}</p><output>{location.search}</output><button onClick={() => q.onView('week')}>Semana</button><button onClick={() => q.onFilters({ priority:'urgent' })}>Urgente</button></> }
it('restores date/view/filters from direct URL and retains them across view changes', async () => {
  render(<MemoryRouter initialEntries={['/app/calendar?date=2030-12-31&view=month&status=pending']}><Probe /></MemoryRouter>)
  expect(screen.getByText('2030-12-31 / month')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name:'Semana' }))
  expect(screen.getByRole('status')).toHaveTextContent('date=2030-12-31&view=week&status=pending')
  await userEvent.click(screen.getByRole('button', { name:'Urgente' })); expect(screen.getByRole('status')).toHaveTextContent('priority=urgent')
})
