import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { AppRoutes } from '../routes/AppRoutes'
import { jsonResponse, makeToken, user } from '../test/authFixtures'
import type { Subject } from '../types/subject'
const catalog = { version: 1, color_bases: ['blue', 'green'], color_shades: [100, 300] }
const item: Subject = { id: 1, name: 'Álgebra', difficulty: 'medium', color_base: 'blue', color_shade: 100, status: 'active', created_at: '2026-10-20T00:00:00Z', updated_at: '2026-10-20T00:00:00Z' }
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
function setup(path = '/app/subjects', options: { items?: Subject[]; fail?: boolean; conflict?: boolean; incomplete?: boolean } = {}) {
  let items = options.items ?? []
  let fail = options.fail ?? false
  const fetch = vi.fn(async (url: string, request: RequestInit = {}) => {
    if (url.endsWith('/refresh')) return jsonResponse({ access_token: makeToken(), token_type: 'bearer' })
    if (url.endsWith('/me')) return jsonResponse(options.incomplete ? { ...user, onboarding: { ...user.onboarding, status: 'incomplete', next_step: 'academic_profile' } } : user)
    if (url.endsWith('/catalog')) return fail ? jsonResponse({}, 503) : jsonResponse(catalog)
    const parsed = new URL(url, 'http://localhost')
    if (parsed.pathname.endsWith('/subjects') && request.method === 'GET') {
      const status = parsed.searchParams.get('status')
      return jsonResponse({ items: items.filter(i => i.status === status), next_after_id: null })
    }
    if (parsed.pathname.endsWith('/subjects') && request.method === 'POST') {
      if (options.conflict) return jsonResponse({ error: { code: 'SUBJECT_NAME_CONFLICT' } }, 409)
      const created = { ...item, ...JSON.parse(String(request.body)) }; items.push(created); return jsonResponse(created, 201)
    }
    const current = items.find(i => parsed.pathname.includes('/subjects/' + i.id))
    if (!current) return jsonResponse({ error: { code: 'SUBJECT_NOT_FOUND' } }, 404)
    if (request.method === 'PUT') { Object.assign(current, JSON.parse(String(request.body))); return jsonResponse(current) }
    if (request.method === 'DELETE') { items = items.filter(i => i.id !== current.id); return new Response(null, { status: 204 }) }
    if (url.endsWith('/archive')) current.status = 'archived'
    if (url.endsWith('/reactivate')) current.status = 'active'
    return jsonResponse(current)
  })
  vi.stubGlobal('fetch', fetch); document.cookie = 'cognova_csrf=test; Path=/'
  render(<StrictMode><MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></StrictMode>)
  return { fetch, recover: () => { fail = false } }
}
describe('Subjects routes and state', () => {
  it('shows empty state and real catalog options, validates 20 characters then creates', async () => {
    const { fetch } = setup()
    expect(await screen.findByText('Un espacio para tus materias')).toBeVisible()
    fireEvent.click(screen.getByRole('link', { name: 'Nueva materia' }))
    await screen.findByLabelText('Nombre')
    expect(within(screen.getByLabelText('Color')).getAllByRole('option')).toHaveLength(2)
    expect(within(screen.getByLabelText('Tono')).getAllByRole('option')).toHaveLength(2)
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'a'.repeat(21) } })
    fireEvent.submit(screen.getByRole('form', { name: 'Crear materia' }))
    expect(screen.getByRole('alert')).toHaveTextContent('entre 1 y 20')
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '  Física  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear materia' }))
    expect(await screen.findByRole('heading', { name: 'Física' })).toBeVisible()
    expect(screen.getByText('Materia creada.')).toBeVisible()
    expect(fetch.mock.calls.filter(([url, req]) => url.endsWith('/subjects') && req?.method === 'POST')).toHaveLength(1)
  })
  it('preserves a duplicate draft and displays conflict guidance', async () => {
    setup('/app/subjects/new', { conflict: true })
    await screen.findByLabelText('Nombre')
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Duplicada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear materia' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una materia con ese nombre')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Duplicada')
  })
  it('edits, archives and reactivates from a direct detail route', async () => {
    const { fetch } = setup('/app/subjects/1', { items: [{ ...item }] })
    fireEvent.click(await screen.findByRole('button', { name: 'Editar materia' }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Cálculo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Cambios guardados.')).toBeVisible()
    const write = fetch.mock.calls.find(([, req]) => req?.method === 'PUT')
    expect(JSON.parse(String(write?.[1]?.body))).toEqual({ name: 'Cálculo', difficulty: 'medium', color_base: 'blue', color_shade: 100 })
    fireEvent.click(screen.getByRole('button', { name: 'Archivar materia' }))
    expect(await screen.findByText('Materia archivada.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Reactivar materia' }))
    expect(await screen.findByText('Materia reactivada.')).toBeVisible()
  })
  it('requires explicit irreversible confirmation and allows cancelling without DELETE', async () => {
    const { fetch } = setup('/app/subjects/1', { items: [{ ...item }] })
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar materia' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Eliminar definitivamente' })).toBeDisabled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(fetch.mock.calls.some(([, r]) => r?.method === 'DELETE')).toBe(false)
    expect(screen.getByRole('button', { name: 'Eliminar materia' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar materia' }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }))
    expect(await screen.findByText('Materia eliminada.')).toBeVisible()
    expect(await screen.findByText('Un espacio para tus materias')).toBeVisible()
    expect(fetch.mock.calls.filter(([, r]) => r?.method === 'DELETE')).toHaveLength(1)
  })
  it('closes the native dialog before restoring trigger focus on Escape cancellation', async () => {
    const { fetch } = setup('/app/subjects/1', { items: [{ ...item }] })
    const trigger = await screen.findByRole('button', { name: 'Eliminar materia' })
    fireEvent.click(trigger)
    const focus = vi.spyOn(trigger, 'focus')
    const close = vi.spyOn(HTMLDialogElement.prototype, 'close')
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(close.mock.invocationCallOrder[0]).toBeLessThan(focus.mock.invocationCallOrder[0])
    expect(fetch.mock.calls.some(([, request]) => request?.method === 'DELETE')).toBe(false)
  })
  it('blocks creation at five active subjects', async () => {
    setup('/app/subjects/new', { items: Array.from({ length: 5 }, (_, i) => ({ ...item, id: i+1 })) })
    expect(await screen.findByText('Ya tienes cinco materias activas. Archiva una antes de crear otra.')).toBeVisible()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })
  it('archived subjects do not count and cannot reactivate when slots are full', async () => {
    setup('/app/subjects/6', { items: [...Array.from({ length: 5 }, (_, i) => ({ ...item, id: i+1 })), { ...item, id: 6, status: 'archived' }] })
    expect(await screen.findByRole('button', { name: 'Reactivar materia' })).toBeDisabled()
    expect(screen.getByText('No hay cupo para reactivar esta materia. Archiva otra primero.')).toBeVisible()
  })
  it('lists archived subjects separately without reducing capacity', async () => {
    setup('/app/subjects/archived', { items: [{ ...item, status: 'archived' }] })
    expect(await screen.findByRole('heading', { name: 'Álgebra' })).toBeVisible()
    expect(screen.getByText('0 de 5 materias activas. Las archivadas no ocupan cupo.')).toBeVisible()
  })
  it('shows a retry after a read failure', async () => {
    const { recover } = setup('/app/subjects', { fail: true })
    expect(await screen.findByRole('alert')).toHaveTextContent('no está disponible')
    recover(); fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Un espacio para tus materias')).toBeVisible()
  })
  it('handles absent and invalid detail routes without exposing technical errors', async () => {
    setup('/app/subjects/not-an-id')
    expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos esta materia')
  })
  it('respects incomplete onboarding before requesting subjects', async () => {
    const { fetch } = setup('/app/subjects', { incomplete: true })
    await waitFor(() => expect(screen.getByRole('heading', { name: /perfil académico/i })).toBeVisible())
    expect(fetch.mock.calls.some(([url]) => url.includes('/subjects'))).toBe(false)
  })
})
