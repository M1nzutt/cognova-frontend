import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { CalendarMonth } from './CalendarMonth'
import { fullDay, groupCalendar, period } from '../utils/calendarDates'
import { calendarItem } from '../test/calendarFixtures'
it('renders complete month weeks and places the item on its local deadline', () => {
  const deadline = new Date(calendarItem.deadline), date = new Date(2030,0,15)
  render(<MemoryRouter><CalendarMonth days={period(date,'month').days} date={date} subjects={[]} groups={groupCalendar([calendarItem])} /></MemoryRouter>)
  expect(screen.getByRole('region', { name: 'Vista mensual' }).querySelectorAll('section')).toHaveLength(35)
  expect(within(screen.getByRole('region', { name: fullDay(deadline) })).getByRole('link', { name: /Preparar ensayo/ })).toBeVisible()
  expect(screen.getAllByRole('link')).toHaveLength(1)
})
