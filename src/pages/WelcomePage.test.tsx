import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { WelcomePage } from './WelcomePage'

describe('public welcome page', () => {
  it('presents the product with one primary account action and a useful preview', () => {
    render(<MemoryRouter><WelcomePage /></MemoryRouter>)

    expect(screen.getByRole('heading', { level: 1, name: 'Estudia con más claridad, a tu manera.' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Crear mi cuenta' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: /conocer cómo funciona/i })).toHaveAttribute('href', '#como-funciona')
    expect(screen.getByRole('figure', { name: 'Ejemplo de organización semanal en Cognova' })).toBeVisible()
    expect(screen.getByText('Física')).toBeVisible()
    expect(screen.getByText('Álgebra')).toBeVisible()
  })

  it('explains the three product values without building a wall of cards', () => {
    render(<MemoryRouter><WelcomePage /></MemoryRouter>)

    const values = screen.getByRole('region', { name: 'Una forma más consciente de estudiar.' })
    expect(within(values).getAllByRole('heading', { level: 3 })).toHaveLength(3)
    for (const value of ['Organiza', 'Registra', 'Comprende']) {
      expect(within(values).getByRole('heading', { name: value })).toBeVisible()
    }
  })

  it('frames AI as evidence and a question while keeping the decision with the student', () => {
    render(<MemoryRouter><WelcomePage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Una IA que observa y pregunta. Tú eliges.' })).toBeVisible()
    expect(screen.getByText('EJEMPLO DE REFLEXIÓN')).toBeVisible()
    expect(screen.getByText('3 aplazamientos registrados')).toBeVisible()
    expect(screen.getByText('¿Qué hace más difícil empezar?')).toBeVisible()
    expect(screen.getByText('TÚ DECIDES')).toBeVisible()
    expect(screen.getByText(/No decide por ti/)).toBeVisible()
  })
})
