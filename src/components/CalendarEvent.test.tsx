import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { CalendarEvent } from './CalendarEvent'
import { calendarItem, calendarSession } from '../test/calendarFixtures'
it('offers a keyboard reachable link with subject, priority and status in words', async () => {
  render(<MemoryRouter><CalendarEvent item={calendarItem} subject={{ id:1,name:'Álgebra',status:'archived',difficulty:'medium',color_base:'blue',color_shade:200,created_at:calendarItem.deadline,updated_at:calendarItem.deadline }} /></MemoryRouter>)
  const link = screen.getByRole('link', { name: /Preparar ensayo/ })
  expect(link).toHaveAttribute('href','/app/activities/1')
  expect(link).toHaveTextContent('Álgebra (archivada)'); expect(link).toHaveTextContent('Prioridad alta'); expect(link).toHaveTextContent('Pendiente')
  await userEvent.tab(); expect(link).toHaveFocus()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
it.each([
  ['planned','Planificada'], ['running','En curso'], ['paused','Pausada'], ['finished','Finalizada'],
] as const)('labels the %s session state without relying on color', async (lifecycle, label) => {
  render(<MemoryRouter><CalendarEvent item={{ ...calendarSession, lifecycle, result:lifecycle === 'finished' ? 'partial' : null }} /></MemoryRouter>)
  const link = screen.getByRole('link', { name:'Abrir detalle: Sesión de Materia 1' })
  expect(link).toHaveAttribute('href','/app/sessions/1')
  expect(link).toHaveAttribute('data-type','study_session')
  expect(link).toHaveTextContent('Sesión de estudio')
  expect(link).toHaveTextContent('Estado: ' + label)
  if (lifecycle === 'finished') expect(link).toHaveTextContent('Resultado: Parcial')
  else expect(link).not.toHaveTextContent('Resultado:')
  await userEvent.tab(); expect(link).toHaveFocus()
})
