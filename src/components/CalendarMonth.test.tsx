import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { CalendarMonth } from './CalendarMonth'
import { fullDay, groupCalendar, period } from '../utils/calendarDates'
import { calendarItem, calendarSession, calendarSubject } from '../test/calendarFixtures'
it('renders complete month weeks and places the item on its local deadline', () => {
  const deadline = new Date(calendarItem.deadline), date = new Date(2030,0,15)
  render(<MemoryRouter><CalendarMonth days={period(date,'month').days} date={date} subjects={[]} groups={groupCalendar([calendarItem])} /></MemoryRouter>)
  expect(screen.getByRole('region', { name: 'Vista mensual' }).querySelectorAll('section')).toHaveLength(35)
  expect(within(screen.getByRole('region', { name: fullDay(deadline) })).getByRole('link', { name: /Preparar ensayo/ })).toBeVisible()
  expect(screen.getAllByRole('link')).toHaveLength(1)
})
it('places a mixed same-instant response on its local day in Backend order', () => {
  const date = new Date(2030,0,15)
  render(<MemoryRouter><CalendarMonth days={period(date,'month').days} date={date} subjects={[calendarSubject]} groups={groupCalendar([calendarItem,calendarSession])} /></MemoryRouter>)
  const day = screen.getByRole('region', { name: fullDay(new Date(calendarItem.deadline)) })
  const links = within(day).getAllByRole('link')
  expect(links.map(link => link.getAttribute('href'))).toEqual(['/app/activities/1','/app/sessions/1'])
  expect(within(day).getByText('Actividad')).toBeVisible()
  expect(within(day).getByText('Sesión de estudio')).toBeVisible()
})
