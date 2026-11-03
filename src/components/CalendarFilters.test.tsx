import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CalendarFilters } from './CalendarFilters'
it('labels filters and translates selections without exposing tokens', () => {
  const onChange = vi.fn()
  render(<CalendarFilters value={{ type:'all', status:'pending' }} subjects={[]} onChange={onChange} />)
  expect(screen.getByRole('option', { name:'En progreso' })).toHaveValue('in_progress')
  fireEvent.change(screen.getByLabelText('Filtrar por prioridad'), { target: { value:'urgent' } })
  expect(onChange).toHaveBeenCalledWith({ type:'all', status:'pending', priority:'urgent' })
  fireEvent.click(screen.getByRole('button', { name:'Limpiar filtros' })); expect(onChange).toHaveBeenLastCalledWith({})
})
it('offers all/activity/session types and hides Activity-only filters for sessions', () => {
  const onChange = vi.fn()
  const { rerender } = render(<CalendarFilters value={{ type:'all', status:'pending', priority:'urgent' }} subjects={[]} onChange={onChange} />)
  expect(screen.getByRole('option', { name:'Todos' })).toHaveValue('all')
  expect(screen.getByRole('option', { name:'Actividades' })).toHaveValue('activity')
  expect(screen.getByRole('option', { name:'Sesiones' })).toHaveValue('study_session')
  expect(screen.getByLabelText('Filtrar por tipo')).toHaveAttribute('aria-describedby','calendar-type-help')
  expect(screen.getByText(/Materia aplica a Actividades y Sesiones/)).toBeVisible()
  fireEvent.change(screen.getByLabelText('Filtrar por tipo'), { target:{ value:'study_session' } })
  expect(onChange).toHaveBeenLastCalledWith({ type:'study_session', status:undefined, priority:undefined })
  rerender(<CalendarFilters value={{ type:'study_session' }} subjects={[]} onChange={onChange} />)
  expect(screen.queryByLabelText('Filtrar por estado')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Filtrar por prioridad')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Filtrar por materia')).toBeVisible()
})
