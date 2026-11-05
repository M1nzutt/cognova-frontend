import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { studyPlanSetup, planFixture, challengeFixture } from '../test/studyPlanSetup'

describe('study plans', () => {
  it('protects the route and shows an empty state', async () => {
    const anonymous = studyPlanSetup({ anonymous: true })
    expect(await screen.findByRole('heading', { name: /Inicia sesión/i })).toBeVisible()
    expect(anonymous.fetch.mock.calls.some(([url]) => String(url).includes('/study-plans'))).toBe(false)
  })

  it('requires completed onboarding before loading plans', async () => {
    const setup = studyPlanSetup({ incomplete: true })
    expect(await screen.findByRole('heading', { name: 'Tu perfil académico' })).toBeVisible()
    expect(setup.fetch.mock.calls.some(([url]) => String(url).includes('/study-plans'))).toBe(false)
  })

  it('lists, filters and opens a plan by keyboard', async () => {
    const { fetch } = studyPlanSetup()
    const link = await screen.findByRole('link', { name: /Preparar examen/ })
    link.focus(); await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Preparar examen' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Tu ritmo semanal' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'En qué enfocarte' })).toBeVisible()
    expect(fetch.mock.calls.some(([url, request]) => String(url).endsWith('/study-plans/4') && request?.cache === 'no-store')).toBe(true)
  })

  it('filters by state in a persistent URL and shows no matches', async () => {
    const { fetch } = studyPlanSetup()
    await screen.findByRole('link', { name: /Preparar examen/ })
    await userEvent.selectOptions(screen.getByLabelText('Ver planes'), 'active')
    expect(await screen.findByText('No hay planes con este estado')).toBeVisible()
    expect(fetch.mock.calls.some(([url]) => String(url).includes('status=active'))).toBe(true)
  })

  it('creates a manual plan and opens its direct detail route', async () => {
    const setup = studyPlanSetup({ plans: [] })
    expect(await screen.findByText('Tu primer plan empieza aquí')).toBeVisible()
    await userEvent.click(screen.getByRole('link', { name: 'Crear plan' }))
    await screen.findByRole('heading', { name: 'Crear plan de estudio' })
    await userEvent.type(screen.getByLabelText('Nombre del plan'), 'Plan de lectura')
    await userEvent.type(screen.getByLabelText('¿Qué quieres lograr?'), 'Leer tres capítulos')
    await userEvent.click(screen.getByRole('button', { name: 'Crear plan' }))
    expect(await screen.findByRole('heading', { name: 'Plan de lectura' })).toBeVisible()
    expect(setup.plans).toHaveLength(1)
    const create = setup.fetch.mock.calls.find(([url, request]) => String(url).endsWith('/study-plans') && request?.method === 'POST')
    expect(JSON.parse(String(create?.[1]?.body)).subject_ids).toEqual([])
  })

  it('edits a draft and retains links to existing resources', async () => {
    const { fetch } = studyPlanSetup({ path: '/app/study-plans/4' })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    expect(screen.getAllByRole('link', { name: planFixture.activities[0].title })[0]).toHaveAttribute('href', `/app/activities/${planFixture.activities[0].id}`)
    await userEvent.click(screen.getByRole('button', { name: 'Editar borrador' }))
    const name = await screen.findByLabelText('Nombre del plan')
    await userEvent.clear(name); await userEvent.type(name, 'Examen final')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('heading', { name: 'Examen final' })).toBeVisible()
    expect(fetch.mock.calls.some(([url, request]) => String(url).endsWith('/study-plans/4') && request?.method === 'PUT')).toBe(true)
  })

  it('activates, completes and abandons under backend transitions', async () => {
    const setup = studyPlanSetup({ path: '/app/study-plans/4' })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    await userEvent.click(screen.getByRole('button', { name: 'Activar plan' }))
    expect(await screen.findByRole('button', { name: 'Completar plan' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Completar plan' }))
    await waitFor(() => expect(setup.plans[0].status).toBe('completed'))
    expect(setup.plans[0].status).toBe('completed')
  })

  it('abandons an active plan without offering further transitions', async () => {
    const active = { ...structuredClone(planFixture), status: 'active' as const }
    studyPlanSetup({ path: '/app/study-plans/4', plans: [active] })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    await userEvent.click(screen.getByRole('button', { name: 'Abandonar plan' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Completar plan' })).not.toBeInTheDocument())
    expect(screen.getAllByText('Abandonado').length).toBeGreaterThan(0)
  })

  it('accepts or rejects AI proposals with visible decision evidence', async () => {
    const proposed = { ...structuredClone(planFixture), source: 'ai' as const }
    studyPlanSetup({ path: '/app/study-plans/4', plans: [proposed] })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    await userEvent.click(screen.getByRole('button', { name: 'Aceptar propuesta' }))
    expect(await screen.findByText(/Aceptaste Preparar examen/)).toBeVisible()
  })

  it('shows that rejecting an AI proposal did not apply it', async () => {
    const proposed = { ...structuredClone(planFixture), source: 'ai' as const }
    studyPlanSetup({ path: '/app/study-plans/4', plans: [proposed] })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar propuesta' }))
    expect(await screen.findByText(/Rechazaste Preparar examen; no se aplicó/)).toBeVisible()
  })

  it('requires confirmation for a safe empty draft deletion', async () => {
    const empty = { ...structuredClone(planFixture), subjects: [], activities: [], study_sessions: [], priority_order: [], activity_dependency_order: [] }
    const setup = studyPlanSetup({ path: '/app/study-plans/4', plans: [empty] })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar plan' }))
    expect(screen.getByRole('dialog')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    expect(await screen.findByText('Tu primer plan empieza aquí')).toBeVisible()
    expect(setup.plans).toHaveLength(0)
    expect(setup.fetch.mock.calls.some(([url, request]) => String(url).includes('confirm=true') && request?.method === 'DELETE')).toBe(true)
  })

  it('does not offer deletion when a draft has related resources', async () => {
    studyPlanSetup({ path: '/app/study-plans/4' })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    expect(screen.queryByRole('button', { name: 'Eliminar plan' })).not.toBeInTheDocument()
  })

  it('shows decisions and a safe 503 for unavailable regeneration', async () => {
    const proposed = { ...structuredClone(planFixture), source: 'ai' as const, decisions: [{ id: 1, action: 'edited' as const, field_path: 'objective', proposed_value: 'Estudiar', chosen_value: 'Repasar', created_at: planFixture.created_at }] }
    const setup = studyPlanSetup({ path: '/app/study-plans/4', plans: [proposed] })
    expect(await screen.findByText(/Editaste objetivo/)).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Pedir otra propuesta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('todavía no está disponible')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
    expect(setup.fetch.mock.calls.some(([url]) => String(url).endsWith('/regenerate'))).toBe(true)
    expect(setup.plans[0].decisions).toHaveLength(1)
  })

  it('refreshes after a 409 transition', async () => {
    const { fetch } = studyPlanSetup({ path: '/app/study-plans/4', transitionStatus: 409 })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    await userEvent.click(screen.getByRole('button', { name: 'Activar plan' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('cambió')
    await waitFor(() => expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/study-plans/4')).length).toBeGreaterThan(1))
  })

  it('hides another user plan as a safe 404', async () => {
    studyPlanSetup({ path: '/app/study-plans/999' })
    expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos este plan')
  })
})

describe('missions inside plans', () => {
  const active = { ...structuredClone(planFixture), status: 'active' as const, challenge_count: 1 }
  it('allows a mission in a draft as permitted by the backend', async () => {
    studyPlanSetup({ path: '/app/study-plans/4', challenges: [challengeFixture] })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    expect(screen.getByRole('button', { name: 'Añadir misión' })).toBeVisible()
    await userEvent.click(await screen.findByRole('link', { name: 'Repasar células' }))
    expect(await screen.findByRole('button', { name: 'Iniciar misión' })).toBeVisible()
  })
  it('lists and opens a mission with its goal, deadline and related subject', async () => {
    studyPlanSetup({ path: '/app/study-plans/4', plans: [active], challenges: [challengeFixture] })
    const link = await screen.findByRole('link', { name: 'Repasar células' })
    await userEvent.click(link)
    expect(await screen.findByRole('heading', { name: 'Repasar células' })).toBeVisible()
    expect(screen.getByText('Estudiar 30 minutos')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Biología' })).toHaveAttribute('href', '/app/subjects/1')
  })

  it('creates a contextual mission from an active plan', async () => {
    const setup = studyPlanSetup({ path: '/app/study-plans/4', plans: [active] })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    await userEvent.click(screen.getByRole('button', { name: 'Añadir misión' }))
    await userEvent.type(screen.getByLabelText('Nombre de la misión'), 'Estudiar células')
    await userEvent.type(screen.getByLabelText('¿Cómo vas a cumplirla?'), 'Leer y repasar')
    await userEvent.selectOptions(screen.getByLabelText('Materia relacionada'), '1')
    await userEvent.click(screen.getByRole('button', { name: 'Añadir misión' }))
    expect(await screen.findByRole('link', { name: 'Estudiar células' })).toBeVisible()
    expect(setup.challenges).toHaveLength(1)
    const create = setup.fetch.mock.calls.find(([url, request]) => String(url).endsWith('/challenges') && request?.method === 'POST')
    expect(JSON.parse(String(create?.[1]?.body)).target_value).toEqual({ minutes: 30 })
  })

  it('starts and completes a mission and supports direct refresh route', async () => {
    const setup = studyPlanSetup({ path: '/app/study-plans/4/challenges/8', plans: [active], challenges: [challengeFixture] })
    await screen.findByRole('heading', { name: 'Repasar células' })
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar misión' }))
    expect(await screen.findByRole('button', { name: 'Completar misión' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Completar misión' }))
    await waitFor(() => expect(setup.challenges[0].status).toBe('completed'))
    expect(setup.challenges[0].status).toBe('completed')
  })

  it('cancels a pending mission and hides further actions', async () => {
    const setup = studyPlanSetup({ path: '/app/study-plans/4/challenges/8', plans: [active], challenges: [challengeFixture] })
    await screen.findByRole('heading', { name: 'Repasar células' })
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar misión' }))
    await waitFor(() => expect(setup.challenges[0].status).toBe('cancelled'))
    expect(screen.queryByRole('button', { name: 'Iniciar misión' })).not.toBeInTheDocument()
  })

  it('handles ownership 404 and a refreshable challenge conflict', async () => {
    studyPlanSetup({ path: '/app/study-plans/4/challenges/999', plans: [active] })
    expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos este plan o esta misión')
  })

  it('refreshes a mission after a 409 without leaking server details', async () => {
    const setup = studyPlanSetup({ path: '/app/study-plans/4/challenges/8', plans: [active], challenges: [challengeFixture], challengeStatus: 409 })
    await screen.findByRole('heading', { name: 'Repasar células' })
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar misión' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('cambió')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
    await waitFor(() => expect(setup.fetch.mock.calls.filter(([url]) => String(url).endsWith('/challenges/8')).length).toBeGreaterThan(1))
  })

  it('edits a pending mission and allows failure or cancellation', async () => {
    const setup = studyPlanSetup({ path: '/app/study-plans/4/challenges/8', plans: [active], challenges: [challengeFixture] })
    await screen.findByRole('heading', { name: 'Repasar células' })
    await userEvent.click(screen.getByRole('button', { name: 'Editar misión' }))
    const title = screen.getByLabelText('Nombre de la misión')
    fireEvent.change(title, { target: { value: 'Repasar tejidos' } })
    await userEvent.click(screen.getByRole('button', { name: 'Guardar misión' }))
    expect(await screen.findByRole('heading', { name: 'Repasar tejidos' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar misión' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Marcar como fallida' }))
    await waitFor(() => expect(setup.challenges[0].status).toBe('failed'))
    expect(setup.challenges[0].status).toBe('failed')
  })
})
