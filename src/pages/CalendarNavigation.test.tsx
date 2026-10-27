import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { calendarSetup } from '../test/calendarSetup'
import { calendarItem } from '../test/calendarFixtures'
import { jsonResponse } from '../test/authFixtures'
import { dayKey } from '../utils/calendarDates'
it('restores a weekly direct URL with filters and changes month/year then today', async () => {
  const { fetch } = calendarSetup({ path:'/app/calendar?date=2030-12-31&view=week&priority=urgent',calendar:async () => jsonResponse({ items:[],next_cursor:null }) })
  expect(await screen.findByRole('region', { name:'Vista semanal' })).toBeVisible()
  expect(screen.getByLabelText('Filtrar por prioridad')).toHaveValue('urgent')
  fireEvent.click(screen.getByRole('button', { name:'Mes',exact:true }))
  await screen.findByRole('region', { name:'Vista mensual' })
  fireEvent.click(screen.getByRole('button', { name:'Periodo siguiente' }))
  expect(await screen.findByRole('heading', { name:'enero de 2031' })).toBeVisible()
  expect(screen.getByTestId('location')).toHaveTextContent('date=2031-01-01&view=month&priority=urgent')
  fireEvent.click(screen.getByRole('button', { name:'Hoy',exact:true }))
  expect(screen.getByLabelText('Ir a fecha')).toHaveValue(dayKey(new Date()))
  await waitFor(() => expect(fetch.mock.calls.filter(([url]) => url.includes('/calendar')).length).toBeGreaterThan(2))
})
it('applies all three filters to HTTP and clears to full results', async () => {
  const { fetch } = calendarSetup({ calendar:async url => jsonResponse({ items:url.searchParams.has('priority') ? [] : [calendarItem],next_cursor:null }) })
  await screen.findByRole('link', { name:/Preparar ensayo/ })
  fireEvent.change(screen.getByLabelText('Filtrar por materia'), { target:{ value:'1' } })
  fireEvent.change(screen.getByLabelText('Filtrar por estado'), { target:{ value:'pending' } })
  fireEvent.change(screen.getByLabelText('Filtrar por prioridad'), { target:{ value:'urgent' } })
  expect(await screen.findByText('No hay actividades con estos filtros')).toBeVisible()
  const queries = fetch.mock.calls.filter(([url]) => url.includes('/calendar')).map(([url]) => new URL(url,'https://test').searchParams)
  expect(queries.some(q => q.get('subject_id') === '1' && q.get('status') === 'pending' && q.get('priority') === 'urgent')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name:'Limpiar filtros' }))
  expect(await screen.findByRole('link', { name:/Preparar ensayo/ })).toBeVisible()
  expect(screen.getByTestId('location')).not.toHaveTextContent('priority=')
})
it('restores date and filters after a fresh mount equivalent to route refresh', async () => {
  const first = calendarSetup({ calendar:async () => jsonResponse({ items:[],next_cursor:null }) })
  await screen.findByRole('region', { name:'Vista mensual' })
  fireEvent.change(screen.getByLabelText('Ir a fecha'), { target:{ value:'2032-02-29' } })
  fireEvent.click(screen.getByRole('button', { name:'Semana',exact:true }))
  fireEvent.change(screen.getByLabelText('Filtrar por estado'), { target:{ value:'completed' } })
  const path = '/app/calendar' + screen.getByTestId('location').textContent
  first.unmount()
  calendarSetup({ path,calendar:async () => jsonResponse({ items:[],next_cursor:null }) })
  expect(await screen.findByRole('region', { name:'Vista semanal' })).toBeVisible()
  expect(screen.getByLabelText('Ir a fecha')).toHaveValue('2032-02-29')
  expect(screen.getByLabelText('Filtrar por estado')).toHaveValue('completed')
})
