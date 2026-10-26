import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CalendarFilters } from './CalendarFilters'
it('labels filters and translates selections without exposing tokens', () => {
  const onChange = vi.fn()
  render(<CalendarFilters value={{ status:'pending' }} subjects={[]} onChange={onChange} />)
  expect(screen.getByRole('option', { name:'En progreso' })).toHaveValue('in_progress')
  fireEvent.change(screen.getByLabelText('Filtrar por prioridad'), { target: { value:'urgent' } })
  expect(onChange).toHaveBeenCalledWith({ status:'pending', priority:'urgent' })
  fireEvent.click(screen.getByRole('button', { name:'Limpiar filtros' })); expect(onChange).toHaveBeenLastCalledWith({})
})
