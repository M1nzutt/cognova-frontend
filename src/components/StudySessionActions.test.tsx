import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StudySessionActions } from './StudySessionActions'

describe('study session timer controls', () => {
  it.each([
    { state: 'planned' as const, shown: 'Iniciar sesión', hidden: 'Pausar' },
    { state: 'running' as const, shown: 'Pausar', hidden: 'Iniciar sesión' },
    { state: 'paused' as const, shown: 'Reanudar', hidden: 'Pausar' },
    { state: 'finished' as const, shown: '', hidden: 'Iniciar sesión' },
  ])('shows only actions valid for $state', ({ state, shown, hidden }) => {
    render(<StudySessionActions state={state} busy={false} onStart={vi.fn()} onPause={vi.fn()} onResume={vi.fn()} onFinish={vi.fn()} />)
    if (shown) expect(screen.getByRole('button', { name: shown })).toBeEnabled()
    expect(screen.queryByRole('button', { name: hidden })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Controles del temporizador' })).toBeVisible()
  })

  it('disables repeat actions while an API transition is being synchronized', async () => {
    const onPause = vi.fn()
    render(<StudySessionActions state="running" busy onStart={vi.fn()} onPause={onPause} onResume={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Sincronizando')
    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(onPause).not.toHaveBeenCalled()
  })
})
