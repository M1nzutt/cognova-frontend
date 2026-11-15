import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingStatus } from './LoadingStatus'

describe('LoadingStatus', () => {
  it('announces the loading message while keeping the decorative indicator hidden', () => {
    render(<LoadingStatus label="Cargando tus materias…" />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Cargando tus materias…')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
