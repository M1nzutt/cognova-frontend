import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { name: 'Prueba móvil' },
    session: { logout: vi.fn() },
  }),
}))

function PreviousPage() {
  const navigate = useNavigate()
  return <button type="button" onClick={() => navigate(-1)}>Retroceder</button>
}

function setup(initial = '/dashboard') {
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<PreviousPage />} />
          <Route path="/app/activities" element={<PreviousPage />} />
          <Route path="/app/analytics" element={<PreviousPage />} />
          <Route path="/app/calendar" element={<PreviousPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
  return { nav, more: within(nav).getByRole('button', { name: 'Más secciones' }) }
}

describe('mobile More navigation', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  it('opens, closes with Escape or outside tap, and exposes every secondary section', () => {
    const { nav, more } = setup()
    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(within(nav).queryByRole('link', { name: 'Actividades' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'IA Cognova' })).not.toBeInTheDocument()
    fireEvent.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    for (const label of ['Actividades', 'Sesiones', 'IA y reflexiones', 'Análisis']) {
      expect(within(nav).getByRole('link', { name: label })).toBeVisible()
    }
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(more).toHaveFocus()
    fireEvent.click(more)
    fireEvent.pointerDown(document.body)
    expect(more).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on navigation, remains closed on browser Back, and follows route changes', () => {
    const { nav, more } = setup()
    fireEvent.click(more)
    fireEvent.click(within(nav).getByRole('link', { name: 'Análisis' }))
    expect(screen.getByText('Análisis', { selector: '[aria-current="location"]' })).toBeVisible()
    expect(more).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Retroceder' }))
    expect(screen.getByText('Inicio', { selector: '[aria-current="location"]' })).toBeVisible()
    expect(more).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(more)
    fireEvent.click(within(nav).getByRole('link', { name: 'Calendario' }))
    expect(more).toHaveAttribute('aria-expanded', 'false')
  })
})
