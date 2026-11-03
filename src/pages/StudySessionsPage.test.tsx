import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { studySessionSetup } from '../test/studySessionSetup'
import { sessionSummary, studySession } from '../test/studySessionFixtures'

describe('protected study sessions list', () => {
  it('lists plans and restores an active or paused session after refresh', async () => {
    const paused = { ...studySession, execution_state: 'paused' as const, intervals: [{ id: 21, started_at: studySession.start_at!, ended_at: '2030-01-15T15:15:00Z' }], actual_duration: '600.000000' }
    studySessionSetup({ sessions: [paused] })
    expect(await screen.findByRole('heading', { name: 'Sesiones de estudio' })).toBeVisible()
    expect(await screen.findByRole('heading', { name: 'Tu temporizador está en pausa' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Volver a la sesión activa' })).toHaveAttribute('href', '/app/sessions/8')
    expect(await screen.findByRole('link', { name: /Sesión de Biología/ })).toBeVisible()
  })

  it('applies filters through the API and opens a session with keyboard', async () => {
    const { fetch } = studySessionSetup({ sessions: [{ ...sessionSummary, intervals: [], other_text: null }] })
    expect(await screen.findByRole('link', { name: /Sesión de Biología/ })).toBeVisible()
    await userEvent.selectOptions(screen.getByLabelText('Filtrar sesiones por materia'), '2')
    await userEvent.selectOptions(screen.getByLabelText('Filtrar sesiones por ciclo'), 'planned')
    fireEvent.change(screen.getByLabelText('Planificada desde'), { target: { value: '2030-01-01T00:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(await screen.findByText('No hay sesiones con estos filtros')).toBeVisible()
    const filterUrl = fetch.mock.calls.map(([url]) => String(url)).find(url => url.includes('subject_id=2'))
    expect(filterUrl).toContain('execution_state=planned')
    expect(filterUrl).toContain('planned_start_from=')

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    const link = await screen.findByRole('link', { name: /Sesión de Biología/ })
    link.focus(); await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Sesión de Biología' })).toBeVisible()
  })

  it('shows an empty state', async () => {
    studySessionSetup({ sessions: [] })
    expect(await screen.findByText('No hay sesiones con estos filtros')).toBeVisible()
  })

  it('shows safe errors without leaking server messages', async () => {
    studySessionSetup({ listStatus: 503 })
    expect(await screen.findByRole('alert')).toHaveTextContent('servicio no está disponible')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
  })
})
