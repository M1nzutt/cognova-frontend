import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { AppRoutes } from '../routes/AppRoutes'
import { jsonResponse, makeToken, user } from '../test/authFixtures'
import { activity } from '../test/activityFixtures'
import type { Activity, DeadlineEvent } from '../types/activity'
const subject = { id: 1, name: 'Álgebra', difficulty: 'medium', color_base: 'blue', color_shade: 100, status: 'archived', created_at: activity.created_at, updated_at: activity.updated_at }
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
function setup(path = '/app/activities', options: { items?: Activity[]; noSubjects?: boolean; fail?: boolean; writeStatus?: number; incomplete?: boolean; history?: DeadlineEvent[] } = {}) {
  let items = structuredClone(options.items ?? []), fail = options.fail ?? false, writeStatus = options.writeStatus
  const events = structuredClone(options.history ?? [])
  const fetch = vi.fn(async (url: string, request: RequestInit = {}) => {
    if (url.endsWith('/refresh')) return jsonResponse({ access_token: makeToken(), token_type: 'bearer' })
    if (url.endsWith('/me')) return jsonResponse(options.incomplete ? { ...user, onboarding: { ...user.onboarding, status: 'incomplete', next_step: 'academic_profile' } } : user)
    const parsed = new URL(url, 'https://test'), p = parsed.pathname, method = request.method
    if (p.endsWith('/subjects')) return jsonResponse({ items: options.noSubjects ? [] : [subject], next_after_id: null })
    if (fail) return jsonResponse({ error: { code: 'SERVICE_UNAVAILABLE' } }, 503)
    if (writeStatus && ['POST', 'PUT', 'PATCH'].includes(method ?? '')) return jsonResponse({ error: { code: writeStatus === 409 ? 'ACTIVITY_DEADLINE_CONFLICT' : 'VALIDATION_ERROR', message: 'private detail' } }, writeStatus)
    if (p.endsWith('/activities')) {
      if (method === 'POST') { const value = { ...activity, ...JSON.parse(String(request.body)) }; items.push(value); return jsonResponse(value, 201) }
      return jsonResponse({ items: items.filter(i => !parsed.searchParams.get('status') || i.status === parsed.searchParams.get('status')), next_after_id: null })
    }
    const item = items.find(i => p.split('/')[4] === String(i.id))
    if (!item) return jsonResponse({ error: { code: 'ACTIVITY_NOT_FOUND' } }, 404)
    if (p.endsWith('/deadline-history')) return jsonResponse({ items: events, next_after_revision: null })
    if (method === 'DELETE') {
      if (events.length) return jsonResponse({ error: { code: 'ACTIVITY_HAS_DEPENDENCIES' } }, 409)
      items = items.filter(i => i.id !== item.id); return new Response(null, { status: 204 })
    }
    const body = request.body ? JSON.parse(String(request.body)) : {}
    if (method === 'PUT') Object.assign(item, body)
    if (p.endsWith('/status')) item.status = body.status
    if (p.endsWith('/deadline')) {
      events.push({ revision: ++item.deadline_revision, previous_deadline: item.deadline, new_deadline: body.deadline, event_type: Date.parse(body.deadline) > Date.parse(item.deadline) ? 'postponed' : 'rescheduled', occurred_at: activity.created_at }); item.deadline = body.deadline
    }
    return jsonResponse(item)
  })
  vi.stubGlobal('fetch', fetch); document.cookie = 'cognova_csrf=test; Path=/'
  render(<StrictMode><MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></StrictMode>)
  return { fetch, recover: () => { fail = false; writeStatus = undefined }, concurrentChange: () => { items[0].deadline_revision = 4 } }
}
describe('Activities authenticated views', () => {
  it('loads empty state and creates with an archived own subject', async () => {
    const { fetch } = setup()
    expect(await screen.findByText('Tu próximo paso empieza aquí')).toBeVisible()
    fireEvent.click(screen.getByRole('link', { name: 'Nueva actividad' }))
    await screen.findByLabelText('Título')
    expect(screen.getByRole('option', { name: 'Álgebra (archivada)' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: '  Leer ensayo  ' } })
    fireEvent.change(screen.getByLabelText('Fecha límite'), { target: { value: '2030-01-01T12:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear actividad' }))
    expect(await screen.findByRole('heading', { name: 'Leer ensayo' })).toBeVisible()
    expect(screen.getByText('Actividad creada.')).toBeVisible()
    const call = fetch.mock.calls.find(([,r]) => r?.method === 'POST' && r?.body?.toString().includes('Leer ensayo'))
    expect(Object.keys(JSON.parse(String(call?.[1]?.body))).sort()).toEqual(['deadline','estimated_duration','notes','priority','status','subject_id','title'])
  })
  it('requires a subject before creation', async () => {
    setup('/app/activities/new', { noSubjects: true })
    expect(await screen.findByText('Primero necesitas una materia')).toBeVisible(); expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })
  it.each([['Título', 'x'.repeat(51), 'entre 1 y 50'], ['Notas (opcional)', 'x'.repeat(201), 'hasta 200'], ['Duración estimada (min)', '9', 'entre 10 y 300']])('validates %s before sending', async (field, value, message) => {
    const { fetch } = setup('/app/activities/new'); await screen.findByLabelText('Título')
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Lectura' } }); fireEvent.change(screen.getByLabelText(field), { target: { value } })
    fireEvent.submit(screen.getByRole('form', { name: 'Crear actividad' }))
    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(fetch.mock.calls.some(([u,r]) => u.endsWith('/activities') && r?.method === 'POST')).toBe(false)
  })
  it.each([409, 422, 503])('preserves edit draft on %s and excludes read-only fields', async status => {
    const { fetch } = setup('/app/activities/1', { items: [activity], writeStatus: status })
    fireEvent.click(await screen.findByRole('button', { name: 'Editar actividad' }))
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Mi borrador' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).not.toHaveTextContent('private'); expect(screen.getByLabelText('Título')).toHaveValue('Mi borrador')
    const body = JSON.parse(String(fetch.mock.calls.find(([,r]) => r?.method === 'PUT')?.[1]?.body))
    expect(body.deadline).toBe(activity.deadline); expect(body.status).toBe(activity.status); expect(body).not.toHaveProperty('id')
  })
  it('applies filters and shows filtered empty state; clears all filters', async () => {
    const { fetch } = setup('/app/activities', { items: [activity] }); await screen.findByLabelText('Filtrar por materia')
    fireEvent.change(screen.getByLabelText('Filtrar por estado'), { target: { value: 'completed' } }); fireEvent.change(screen.getByLabelText('Filtrar por materia'), { target: { value: '1' } }); fireEvent.change(screen.getByLabelText('Filtrar por prioridad'), { target: { value: 'high' } })
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2030-01-01T00:00' } }); fireEvent.change(screen.getByLabelText('Hasta (incluido)'), { target: { value: '2030-01-05T00:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' })); expect(await screen.findByText('No hay actividades con estos filtros')).toBeVisible()
    const url = fetch.mock.calls.map(([u]) => u).find(u => u.includes('status=completed'))!; expect(url).toContain('subject_id=1'); expect(url).toContain('priority=high'); expect(url).toContain('deadline_from='); expect(url).toContain('deadline_to=')
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' })); expect(await screen.findByRole('heading', { name: activity.title })).toBeVisible()
  })
  it('rejects reversed filter ranges without requests', async () => {
    const { fetch } = setup(); await screen.findByLabelText('Desde')
    const count = fetch.mock.calls.length
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2030-02-01T00:00' } }); fireEvent.change(screen.getByLabelText('Hasta (incluido)'), { target: { value: '2030-01-01T00:00' } }); fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(screen.getByRole('alert')).toHaveTextContent('inicio'); expect(fetch.mock.calls.length).toBe(count)
  })
  it('changes state with the observed precondition and guides reopening', async () => {
    const { fetch } = setup('/app/activities/1', { items: [activity] }); await screen.findByLabelText('Nuevo estado')
    fireEvent.change(screen.getByLabelText('Nuevo estado'), { target: { value: 'completed' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar estado' }))
    expect(await screen.findByText('Estado actualizado.')).toBeVisible(); expect(screen.getByText(/reábrela como Pendiente/)).toBeVisible()
    expect(JSON.parse(String(fetch.mock.calls.find(([u,r]) => u.endsWith('/status') && r?.method === 'PATCH')?.[1]?.body))).toEqual({ status: 'completed', expected_status: 'pending' })
    expect(within(screen.getByLabelText('Nuevo estado')).getByRole('option', { name: 'En progreso' })).toBeDisabled()
  })
  it('postpones then advances deadline and preserves original date in detail/history', async () => {
    const { fetch } = setup('/app/activities/1', { items: [activity] }); await screen.findByLabelText('Nueva fecha límite')
    fireEvent.change(screen.getByLabelText('Nueva fecha límite'), { target: { value: '2030-01-03T12:00' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar fecha límite' }))
    expect(await screen.findByText('Fecha postergada')).toBeVisible()
    fireEvent.change(screen.getByLabelText('Nueva fecha límite'), { target: { value: '2030-01-02T12:00' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar fecha límite' }))
    expect(await screen.findByText('Fecha adelantada')).toBeVisible(); expect(screen.getByText('Fecha original')).toBeVisible()
    const calls = fetch.mock.calls.filter(([u,r]) => u.endsWith('/deadline') && r?.method === 'PATCH'); expect(calls.map(([,r]) => JSON.parse(String(r?.body)).expected_revision)).toEqual([0,1])
  })
  it('requires explicit refresh after a conflict, preserving the deadline draft', async () => {
    const { fetch, recover, concurrentChange } = setup('/app/activities/1', { items: [activity], writeStatus: 409 }); await screen.findByLabelText('Nueva fecha límite')
    fireEvent.change(screen.getByLabelText('Nueva fecha límite'), { target: { value: '2030-01-03T12:00' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar fecha límite' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Conservamos tu borrador')
    concurrentChange(); recover(); fireEvent.click(screen.getByRole('button', { name: 'Consultar versión actual' }))
    await screen.findByText(/Versión actual consultada/); expect(screen.getByLabelText('Nueva fecha límite')).toHaveValue('2030-01-03T12:00')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar fecha límite' })); await screen.findByText('Fecha límite actualizada.')
    const calls = fetch.mock.calls.filter(([u,r]) => u.endsWith('/deadline') && r?.method === 'PATCH'); expect(JSON.parse(String(calls[1][1]?.body)).expected_revision).toBe(4)
  })
  it('restores focus on Escape, requires confirmation, deletes once and lists absence', async () => {
    const { fetch } = setup('/app/activities/1', { items: [activity] }); const trigger = await screen.findByRole('button', { name: 'Eliminar actividad' }); fireEvent.click(trigger)
    const close = vi.spyOn(HTMLDialogElement.prototype, 'close'), focus = vi.spyOn(trigger, 'focus')
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true })); expect(trigger).toHaveFocus(); expect(close.mock.invocationCallOrder[0]).toBeLessThan(focus.mock.invocationCallOrder[0]); expect(fetch.mock.calls.some(([,r]) => r?.method === 'DELETE')).toBe(false)
    fireEvent.click(trigger); expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toBeDisabled(); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }))
    expect(await screen.findByText('Actividad eliminada.')).toBeVisible(); expect(await screen.findByText('Tu próximo paso empieza aquí')).toBeVisible()
  })
  it('explains a dependency conflict and keeps the dialog and activity', async () => {
    setup('/app/activities/1', { items: [{ ...activity, deadline_revision: 1 }], history: [{ revision: 1, previous_deadline: activity.deadline, new_deadline: '2030-01-03T15:00:00Z', event_type: 'postponed', occurred_at: activity.created_at }] })
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar actividad' })); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('no puede eliminarse'); expect(screen.getByRole('dialog')).toBeVisible(); expect(screen.getByRole('heading', { name: activity.title })).toBeVisible()
  })
  it('offers retry after failed reads', async () => {
    const { recover } = setup('/app/activities', { fail: true }); expect(await screen.findByRole('alert')).toHaveTextContent('no está disponible'); recover(); fireEvent.click(screen.getByRole('button', { name: 'Reintentar actividades' })); expect(await screen.findByText('Tu próximo paso empieza aquí')).toBeVisible()
  })
  it('shows a safe 404 for invalid direct links', async () => { setup('/app/activities/not-an-id'); expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos esta actividad') })
  it('requires onboarding before fetching activities', async () => {
    const { fetch } = setup('/app/activities', { incomplete: true }); await waitFor(() => expect(screen.getByRole('heading', { name: /perfil académico/i })).toBeVisible()); expect(fetch.mock.calls.some(([u]) => u.includes('/activities'))).toBe(false)
  })
})
