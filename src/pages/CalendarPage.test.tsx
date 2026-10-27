import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { calendarSetup } from '../test/calendarSetup'
import { calendarItem } from '../test/calendarFixtures'
import { jsonResponse } from '../test/authFixtures'
describe('Calendar protected screen', () => {
  it.each([{ anonymous:true },{ incomplete:true }])('enforces existing session/onboarding guard: %j', async options => {
    const { fetch } = calendarSetup(options)
    await screen.findByRole('heading', { name:options.anonymous ? 'Inicia sesión' : /perfil académico/i })
    expect(fetch.mock.calls.some(([url]) => url.includes('/calendar'))).toBe(false)
  })
  it('opens activity detail through a keyboard link without calendar mutation', async () => {
    const { fetch } = calendarSetup()
    const link = await screen.findByRole('link', { name:/Preparar ensayo/ })
    link.focus(); await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name:'Preparar ensayo' })).toBeVisible()
    expect(await screen.findByRole('button', { name:'Editar actividad' })).toBeVisible()
    expect(fetch.mock.calls.filter(([url]) => url.includes('/calendar')).every(([,request]) => request?.method === 'GET')).toBe(true)
  })
  it('loads all pages before reporting the complete period', async () => {
    let resolve!: (response:Response) => void
    calendarSetup({ calendar:async url => url.searchParams.has('after_id') ? new Promise(r => { resolve=r }) : jsonResponse({ items:[calendarItem],next_cursor:{ after_deadline:calendarItem.deadline,after_id:1 } }) })
    await waitFor(() => expect(resolve).toBeTypeOf('function'))
    expect(screen.getByText('Cargando calendario completo…')).toBeVisible()
    expect(screen.queryByRole('link', { name:/Preparar ensayo/ })).not.toBeInTheDocument()
    await act(async () => resolve(jsonResponse({ items:[{ ...calendarItem,id:2,title:'Segundo ensayo' }],next_cursor:null })))
    expect(await screen.findByText('2 actividades en el periodo.')).toBeVisible()
  })
  it('aborts stale requests on navigation and ignores late responses', async () => {
    let resolveOld!: (response:Response) => void
    const oldSignals: AbortSignal[] = []
    calendarSetup({ calendar:async (url,request) => {
      if (url.searchParams.get('deadline_from')!.startsWith('2029-12-31')) {
        oldSignals.push(request.signal!); return new Promise(resolve => { resolveOld=resolve })
      }
      return jsonResponse({ items:[],next_cursor:null })
    } })
    await waitFor(() => expect(resolveOld).toBeTypeOf('function'))
    fireEvent.click(screen.getByRole('button', { name:'Periodo siguiente' }))
    expect(await screen.findByText('No hay actividades en este periodo')).toBeVisible()
    expect(oldSignals.every(signal => signal.aborted)).toBe(true)
    await act(async () => resolveOld(jsonResponse({ items:[calendarItem],next_cursor:null })))
    expect(screen.queryByRole('link', { name:/Preparar ensayo/ })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name:'febrero de 2030' })).toBeVisible()
  })
  it('discards old items while a new period loads and after a failure', async () => {
    let fail!: (response:Response) => void
    calendarSetup({ calendar:async url => url.searchParams.get('deadline_from')!.startsWith('2029-12-31') ? jsonResponse({ items:[calendarItem],next_cursor:null }) : new Promise(resolve => { fail=resolve }) })
    await screen.findByRole('link', { name:/Preparar ensayo/ })
    fireEvent.click(screen.getByRole('button', { name:'Periodo siguiente' }))
    await waitFor(() => expect(fail).toBeTypeOf('function'))
    expect(screen.getByText('Cargando calendario completo…')).toBeVisible()
    expect(screen.queryByRole('link', { name:/Preparar ensayo/ })).not.toBeInTheDocument()
    await act(async () => fail(jsonResponse({ error:{ code:'SERVICE_UNAVAILABLE' } },503)))
    expect(await screen.findByRole('alert')).toHaveTextContent('temporalmente')
    expect(screen.queryByRole('link', { name:/Preparar ensayo/ })).not.toBeInTheDocument()
  })
  it('retries a read failure and renders an empty period', async () => {
    let failed = true
    calendarSetup({ calendar:async () => failed ? jsonResponse({ error:{ code:'SERVICE_UNAVAILABLE' } },503) : jsonResponse({ items:[],next_cursor:null }) })
    expect(await screen.findByRole('alert')).toHaveTextContent('temporalmente')
    failed = false; fireEvent.click(screen.getByRole('button', { name:'Reintentar calendario' }))
    expect(await screen.findByText('No hay actividades en este periodo')).toBeVisible()
    expect(screen.getByRole('region', { name:'Vista mensual' })).toBeVisible()
  })
})
