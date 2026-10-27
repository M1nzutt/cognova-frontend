import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { CalendarEvent } from './CalendarEvent'
import { calendarItem } from '../test/calendarFixtures'
it('offers a keyboard reachable link with subject, priority and status in words', async () => {
  render(<MemoryRouter><CalendarEvent item={calendarItem} subject={{ id:1,name:'Álgebra',status:'archived',difficulty:'medium',color_base:'blue',color_shade:200,created_at:calendarItem.deadline,updated_at:calendarItem.deadline }} /></MemoryRouter>)
  const link = screen.getByRole('link', { name: /Preparar ensayo/ })
  expect(link).toHaveAttribute('href','/app/activities/1')
  expect(link).toHaveTextContent('Álgebra (archivada)'); expect(link).toHaveTextContent('Prioridad alta'); expect(link).toHaveTextContent('Pendiente')
  await userEvent.tab(); expect(link).toHaveFocus()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
