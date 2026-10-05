import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { AppRoutes } from './AppRoutes'
import { jsonResponse, makeToken, user } from '../test/authFixtures'

function Location() { return <span data-testid="location">{useLocation().pathname}</span> }
function mount(path: string) {
  return render(<StrictMode><MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /><Location /></AuthProvider></MemoryRouter></StrictMode>)
}
async function fillLogin() {
  const input = userEvent.setup()
  await input.type(await screen.findByLabelText('Correo electrónico'), user.email)
  await input.type(screen.getByLabelText('Contraseña'), 'Example123!')
  return input
}

describe('authentication routes and forms', () => {
  it.each(['/dashboard', '/questionnaire'])('protects %s without making up a session', async (path) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    mount(path)
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('holds protected UI until refresh and me finish and handles StrictMode once', async () => {
    document.cookie = 'cognova_csrf=csrf; Path=/'
    let finish!: (value: Response) => void
    const fetchMock = vi.fn().mockImplementation(async (url: string) => url.endsWith('/refresh')
      ? new Promise<Response>((resolve) => { finish = resolve }) : jsonResponse(user))
    vi.stubGlobal('fetch', fetchMock)
    mount('/dashboard')
    expect(screen.getByRole('status')).toHaveTextContent('Comprobando tu sesión')
    expect(screen.queryByText(/Has iniciado sesión/)).not.toBeInTheDocument()
    await waitFor(() => expect(finish).toBeTypeOf('function'))
    await act(async () => finish(jsonResponse({ access_token: makeToken(), token_type: 'bearer' })))
    expect(await screen.findByText('Has iniciado sesión correctamente.')).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('logs in to dashboard and revokes logout through the backend', async () => {
    const token = makeToken()
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith('/login')) {
        document.cookie = 'cognova_csrf=csrf; Path=/'
        return jsonResponse({ user, access_token: token, token_type: 'bearer' })
      }
      return new Response(null, { status: 204 })
    })
    vi.stubGlobal('fetch', fetchMock)
    mount('/login')
    const input = await fillLogin()
    await input.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Has iniciado sesión correctamente.')).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
    expect(localStorage.getItem('cognova.access_token')).toBeNull()
    expect(JSON.stringify({ ...localStorage })).not.toContain(token)
    await input.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/v1/auth/logout')
  })

  it('registers all six fields and redirects to questionnaire, not dashboard', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ user, access_token: makeToken(), token_type: 'bearer' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    mount('/register')
    const input = userEvent.setup()
    await input.type(await screen.findByLabelText('Nombre'), '  Sara  ')
    await input.type(screen.getByLabelText('Correo electrónico'), user.email)
    await input.type(screen.getByLabelText(/^Contraseña/), 'Example123!')
    await input.type(screen.getByLabelText('Carrera'), 'Ingeniería')
    await input.type(screen.getByLabelText('Semestre'), '4')
    await input.type(screen.getByLabelText('Objetivo académico'), user.academic_goal)
    await input.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('heading', { name: 'Tu cuenta está lista' })).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent('/questionnaire')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: 'Sara', email: user.email, password: 'Example123!', degree_program: 'Ingeniería', semester: 4, academic_goal: user.academic_goal })
  })

  it('disables duplicate submits and exposes credential errors without expiry messaging', async () => {
    let finish!: (value: Response) => void
    const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    mount('/login')
    const input = await fillLogin()
    await input.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByRole('button', { name: 'Iniciando sesión…' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Comprobando tus datos')
    await act(async () => finish(jsonResponse({ error: { code: 'INVALID_CREDENTIALS' } }, 401)))
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(screen.queryByText(/Tu sesión expiró/)).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects whitespace profile fields before sending registration', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    mount('/register')
    const name = await screen.findByLabelText('Nombre')
    fireEvent.change(name, { target: { value: '   ' } })
    fireEvent.submit(name.closest('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('Completa todos los campos')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('redirects an already restored user away from login', async () => {
    document.cookie = 'cognova_csrf=csrf; Path=/'
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => url.endsWith('/refresh')
      ? jsonResponse({ access_token: makeToken(), token_type: 'bearer' }) : jsonResponse(user)))
    mount('/login')
    expect(await screen.findByText('Has iniciado sesión correctamente.')).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
  })
})
