import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { studySessionSetup } from '../test/studySessionSetup'
import { sessionSummary } from '../test/studySessionFixtures'

describe('study session planning routes', () => {
  it('creates a planned session with a compatible optional activity', async () => {
    const { fetch } = studySessionSetup({ path: '/app/sessions/new', sessions: [] })
    await screen.findByRole('form', { name: 'Planificar sesión' })
    expect(await screen.findByRole('option', { name: 'Leer capítulo' })).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Actividad (opcional)'), '1')
    fireEvent.change(screen.getByLabelText('Fecha y hora planificadas'), { target: { value: '2030-01-16T11:30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Crear sesión planificada' }))
    expect(await screen.findByRole('heading', { name: 'Sesión de Biología' })).toBeVisible()
    const create = fetch.mock.calls.find(([url, request]) => String(url).endsWith('/sessions') && request?.method === 'POST')
    expect(JSON.parse(String(create?.[1]?.body))).toMatchObject({ subject_id: 1, activity_id: 1, planned_duration: 45 })
    expect(JSON.parse(String(create?.[1]?.body))).not.toHaveProperty('user_id')
  })

  it('clears an incompatible activity when the selected subject changes', async () => {
    studySessionSetup({ path: '/app/sessions/new', sessions: [] })
    await screen.findByRole('form', { name: 'Planificar sesión' })
    await screen.findByRole('option', { name: 'Leer capítulo' })
    await userEvent.selectOptions(screen.getByLabelText('Actividad (opcional)'), '1')
    await userEvent.selectOptions(screen.getByLabelText('Materia'), '2')
    await waitFor(() => expect(screen.getByLabelText('Actividad (opcional)')).not.toBeDisabled())
    expect(screen.getByLabelText('Actividad (opcional)')).toHaveValue('')
    expect(screen.queryByRole('option', { name: 'Leer capítulo' })).not.toBeInTheDocument()
  })

  it('edits a plan before execution and sends only supported planning fields', async () => {
    const { fetch } = studySessionSetup({ path: '/app/sessions/8', sessions: [{ ...sessionSummary, activity_id: 4, intervals: [], other_text: null }] })
    expect(await screen.findByRole('heading', { name: 'Sesión de Biología' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Editar planificación' }))
    const date = await screen.findByLabelText('Fecha y hora planificadas')
    fireEvent.change(date, { target: { value: '2030-01-16T11:30' } })
    fireEvent.change(screen.getByLabelText('Duración planificada (minutos)'), { target: { value: '60' } })
    await userEvent.selectOptions(screen.getByLabelText('Materia'), '2')
    await waitFor(() => expect(screen.getByLabelText('Actividad (opcional)')).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button', { name: 'Guardar planificación' }))
    await screen.findByText('Planificación actualizada.')
    const update = fetch.mock.calls.find(([, request]) => request?.method === 'PUT')
    expect(JSON.parse(String(update?.[1]?.body))).toMatchObject({ subject_id: 2, activity_id: null, planned_duration: 60 })
    expect(Object.keys(JSON.parse(String(update?.[1]?.body))).sort()).toEqual(['activity_id', 'planned_duration', 'planned_start_at', 'subject_id'])
  })
})
