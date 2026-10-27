import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CalendarToolbar } from './CalendarToolbar'
import { dayKey } from '../utils/calendarDates'
it('labels views and calls temporal navigation including today', () => {
  const onDate = vi.fn(), onView = vi.fn()
  render(<CalendarToolbar date={new Date(2030,11,31)} view="month" onDate={onDate} onView={onView} />)
  expect(screen.getByRole('button', { name: 'Mes' })).toHaveAttribute('aria-pressed','true')
  fireEvent.click(screen.getByRole('button', { name: 'Periodo siguiente' })); expect(dayKey(onDate.mock.calls[0][0])).toBe('2031-01-01')
  fireEvent.click(screen.getByRole('button', { name: 'Periodo anterior' })); expect(dayKey(onDate.mock.calls[1][0])).toBe('2030-11-01')
  fireEvent.click(screen.getByRole('button', { name: 'Hoy' })); expect(dayKey(onDate.mock.calls[2][0])).toBe(dayKey(new Date()))
  fireEvent.click(screen.getByRole('button', { name: 'Semana' })); expect(onView).toHaveBeenCalledWith('week')
  fireEvent.change(screen.getByLabelText('Ir a fecha'), { target: { value: '2032-02-29' } }); expect(dayKey(onDate.mock.calls[3][0])).toBe('2032-02-29')
})
