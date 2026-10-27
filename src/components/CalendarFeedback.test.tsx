import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CalendarEmpty, CalendarError, CalendarLoading } from './CalendarFeedback'
import { calendarError } from '../utils/calendarError'
import { ApiError } from '../api/ApiError'
it('announces loading and contextual empty results', () => {
  const { rerender } = render(<CalendarLoading />); expect(screen.getByRole('status')).toHaveTextContent('Cargando')
  rerender(<CalendarEmpty filtered={false} />); expect(screen.getByRole('status')).toHaveTextContent('este periodo')
  rerender(<CalendarEmpty filtered />); expect(screen.getByRole('status')).toHaveTextContent('estos filtros')
})
it.each([401,403,422,503,0])('provides a safe error and explicit retry for %s', status => {
  const retry = vi.fn()
  render(<CalendarError message={calendarError(new ApiError('private secret',status))} onRetry={retry} />)
  expect(screen.getByRole('alert')).not.toHaveTextContent('private secret')
  fireEvent.click(screen.getByRole('button', { name:'Reintentar calendario' })); expect(retry).toHaveBeenCalledOnce()
})
