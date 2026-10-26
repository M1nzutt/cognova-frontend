import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { CalendarWeek } from './CalendarWeek'
import { fullDay, groupCalendar, period } from '../utils/calendarDates'
import { calendarItem } from '../test/calendarFixtures'
it('renders seven labelled days and preserves chronological activities', () => {
  const date = new Date(2030,0,15), later = { ...calendarItem, id:2, title:'Revisar ensayo', deadline:'2030-01-15T23:00:00Z' }
  render(<MemoryRouter><CalendarWeek days={period(date,'week').days} date={date} subjects={[]} groups={groupCalendar([calendarItem,later])} /></MemoryRouter>)
  expect(screen.getByRole('region', { name:'Vista semanal' }).querySelectorAll('section')).toHaveLength(7)
  const day = screen.getByRole('region', { name: fullDay(new Date(calendarItem.deadline)) })
  expect(within(day).getAllByRole('link').map(a => a.getAttribute('href'))).toEqual(['/app/activities/1','/app/activities/2'])
})
