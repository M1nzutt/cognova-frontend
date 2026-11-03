import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { calendarSetup } from '../test/calendarSetup'
import { calendarItem, calendarSession } from '../test/calendarFixtures'
import { jsonResponse } from '../test/authFixtures'
import { dayKey } from '../utils/calendarDates'
it('restores a weekly direct URL with filters and changes month/year then today', async () => {
  const { fetch } = calendarSetup({ path:'/app/calendar?date=2030-12-31&view=week&priority=urgent',calendar:async () => jsonResponse({ items:[],next_cursor:null }) })
  expect(await screen.findByRole('region', { name:'Vista semanal' })).toBeVisible()
  expect(screen.getByLabelText('Filtrar por prioridad')).toHaveValue('urgent')
  fireEvent.click(screen.getByRole('button', { name:'Mes' }))
  await screen.findByRole('region', { name:'Vista mensual' })
  fireEvent.click(screen.getByRole('button', { name:'Periodo siguiente' }))
  expect(await screen.findByRole('heading', { name:'enero de 2031' })).toBeVisible()
  expect(screen.getByTestId('location')).toHaveTextContent('date=2031-01-01&view=month&priority=urgent')
  fireEvent.click(screen.getByRole('button', { name:'Hoy' }))
  expect(screen.getByLabelText('Ir a fecha')).toHaveValue(dayKey(new Date()))
  await waitFor(() => expect(fetch.mock.calls.filter(([url]) => url.includes('/calendar')).length).toBeGreaterThan(2))
})
it('restores a session-only direct URL, drops invalid Activity filters and survives refresh', async () => {
  const first = calendarSetup({
    path:'/app/calendar?date=2030-01-15&view=month&type=study_session&status=pending&priority=high',
    calendar:async () => jsonResponse({ items:[calendarSession],next_cursor:null }),
  })
  expect(await screen.findByRole('link', { name:'Abrir detalle: Sesión de Álgebra' })).toBeVisible()
  expect(screen.getByLabelText('Filtrar por tipo')).toHaveValue('study_session')
  expect(screen.queryByLabelText('Filtrar por estado')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Filtrar por prioridad')).not.toBeInTheDocument()
  const initial = new URL(first.fetch.mock.calls.filter(([url]) => url.includes('/calendar')).at(-1)![0], 'https://test').searchParams
  expect(initial.get('type')).toBe('study_session')
  expect(initial.has('status')).toBe(false)
  expect(initial.has('priority')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name:'Semana' }))
  await screen.findByRole('region', { name:'Vista semanal' })
  const path = '/app/calendar' + screen.getByTestId('location').textContent
  expect(path).toContain('type=study_session')
  expect(path).not.toContain('status=')
  expect(path).not.toContain('priority=')
  first.unmount()
  calendarSetup({ path,calendar:async () => jsonResponse({ items:[calendarSession],next_cursor:null }) })
  expect(await screen.findByRole('region', { name:'Vista semanal' })).toBeVisible()
  expect(screen.getByRole('link', { name:'Abrir detalle: Sesión de Álgebra' })).toBeVisible()
})
it('applies all three filters to HTTP and clears to full results', async () => {
  const { fetch } = calendarSetup({ calendar:async url => jsonResponse({ items:url.searchParams.has('priority') ? [] : [calendarItem],next_cursor:null }) })
  await screen.findByRole('link', { name:/Preparar ensayo/ })
  fireEvent.change(screen.getByLabelText('Filtrar por materia'), { target:{ value:'1' } })
  fireEvent.change(screen.getByLabelText('Filtrar por estado'), { target:{ value:'pending' } })
  fireEvent.change(screen.getByLabelText('Filtrar por prioridad'), { target:{ value:'urgent' } })
  expect(await screen.findByText('No hay elementos con estos filtros')).toBeVisible()
  const queries = fetch.mock.calls.filter(([url]) => url.includes('/calendar')).map(([url]) => new URL(url,'https://test').searchParams)
  expect(queries.some(q => q.get('subject_id') === '1' && q.get('status') === 'pending' && q.get('priority') === 'urgent')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name:'Limpiar filtros' }))
  expect(await screen.findByRole('link', { name:/Preparar ensayo/ })).toBeVisible()
  expect(screen.getByTestId('location')).not.toHaveTextContent('priority=')
})
it('applies subject to sessions and omits Activity filters in session-only mode', async () => {
  const { fetch } = calendarSetup({ calendar:async url => jsonResponse({ items:url.searchParams.get('type') === 'study_session' ? [calendarSession] : [calendarItem],next_cursor:null }) })
  await screen.findByRole('link', { name:/Preparar ensayo/ })
  fireEvent.change(screen.getByLabelText('Filtrar por estado'), { target:{ value:'pending' } })
  fireEvent.change(screen.getByLabelText('Filtrar por prioridad'), { target:{ value:'high' } })
  fireEvent.change(screen.getByLabelText('Filtrar por tipo'), { target:{ value:'study_session' } })
  expect(await screen.findByRole('link', { name:'Abrir detalle: Sesión de Álgebra' })).toBeVisible()
  expect(screen.queryByRole('link', { name:/Preparar ensayo/ })).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Filtrar por materia'), { target:{ value:'1' } })
  const query = fetch.mock.calls.filter(([url]) => url.includes('/calendar')).map(([url]) => new URL(url,'https://test').searchParams).at(-1)!
  expect(query.get('type')).toBe('study_session')
  expect(query.get('subject_id')).toBe('1')
  expect(query.has('status')).toBe(false)
  expect(query.has('priority')).toBe(false)
  expect(screen.queryByLabelText('Filtrar por estado')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Filtrar por prioridad')).not.toBeInTheDocument()
})
it('restores date and filters after a fresh mount equivalent to route refresh', async () => {
  const first = calendarSetup({ calendar:async () => jsonResponse({ items:[],next_cursor:null }) })
  await screen.findByRole('region', { name:'Vista mensual' })
  fireEvent.change(screen.getByLabelText('Ir a fecha'), { target:{ value:'2032-02-29' } })
  fireEvent.click(screen.getByRole('button', { name:'Semana' }))
  fireEvent.change(screen.getByLabelText('Filtrar por estado'), { target:{ value:'completed' } })
  const path = '/app/calendar' + screen.getByTestId('location').textContent
  first.unmount()
  calendarSetup({ path,calendar:async () => jsonResponse({ items:[],next_cursor:null }) })
  expect(await screen.findByRole('region', { name:'Vista semanal' })).toBeVisible()
  expect(screen.getByLabelText('Ir a fecha')).toHaveValue('2032-02-29')
  expect(screen.getByLabelText('Filtrar por estado')).toHaveValue('completed')
})
