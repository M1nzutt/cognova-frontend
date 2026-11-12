import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { studyPlanSetup, planFixture, aiPlanFixture, aiProposalFixture, challengeFixture } from '../test/studyPlanSetup'

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

  it('generates a persisted AI draft and opens it without activating it', async () => {
    const { fetch } = studyPlanSetup({ plans: [] })
    const generate = await screen.findByRole('button', { name: 'Proponer un plan con IA' })
    generate.focus(); await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Preparar examen' })).toBeVisible()
    expect(screen.getByText(aiProposalFixture.explanation)).toBeVisible()
    expect(screen.getAllByText('Borrador').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Aceptar propuesta' })).toBeVisible()
    expect(fetch.mock.calls.some(([url, request]) => String(url).endsWith('/study-plans/generate') && request?.method === 'POST')).toBe(true)
    const call = fetch.mock.calls.find(([url]) => String(url).endsWith('/study-plans/generate'))
    expect(call?.[1]?.body).toBeUndefined()
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/activate'))).toBe(false)
    expect(screen.queryByText('gemini-test-model')).not.toBeInTheDocument()
  })

  it('shows generation loading state until the API answers', async () => {
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    studyPlanSetup({ plans: [], generateGate: gate })
    await userEvent.click(await screen.findByRole('button', { name: 'Proponer un plan con IA' }))
    expect(screen.getByRole('button', { name: 'Preparando propuesta…' })).toBeDisabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    release()
    expect(await screen.findByRole('heading', { name: 'Preparar examen' })).toBeVisible()
  })

  it('keeps the plan list visible when AI generation fails', async () => {
    const { fetch } = studyPlanSetup({ plans: [], generateStatus: 503 })
    await userEvent.click(await screen.findByRole('button', { name: 'Proponer un plan con IA' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos generar una propuesta ahora')
    expect(screen.getByRole('button', { name: 'Proponer un plan con IA' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Preparar examen' })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/study-plans/generate'))).toBe(true)
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
    const proposed = structuredClone(aiPlanFixture)
    studyPlanSetup({ path: '/app/study-plans/4', plans: [proposed] })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    await userEvent.click(screen.getByRole('button', { name: 'Aceptar propuesta' }))
    expect(await screen.findByText(/Aceptaste Preparar examen/)).toBeVisible()
    expect(screen.getByText('Valor propuesto')).toBeVisible()
    expect(screen.getByText('Valor elegido')).toBeVisible()
  })

  it('shows that rejecting an AI proposal did not apply it', async () => {
    const proposed = structuredClone(aiPlanFixture)
    studyPlanSetup({ path: '/app/study-plans/4', plans: [proposed] })
    await screen.findByRole('heading', { name: 'Preparar examen' })
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar propuesta' }))
    expect(await screen.findByText(/Rechazaste Preparar examen; no se aplicó/)).toBeVisible()
    expect(screen.getByText('No se eligió un valor.')).toBeVisible()
  })

  it('compares an edited AI draft with its persisted original proposal', async () => {
    const current = { ...structuredClone(aiPlanFixture), name: 'Revisar biología', decisions: [{ id: 3, action: 'edited' as const, field_path: 'name', proposed_value: 'Preparar examen', chosen_value: 'Revisar biología', created_at: planFixture.created_at }] }
    studyPlanSetup({ path: '/app/study-plans/4', plans: [current] })
    expect(await screen.findByText('Nombre original')).toBeVisible()
    expect(screen.getByText('Nombre actual')).toBeVisible()
    expect(screen.getAllByText('Revisar biología').length).toBeGreaterThan(0)
    expect(screen.getByText(/Editaste nombre: de Preparar examen a Revisar biología/)).toBeVisible()
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

  it('shows decisions and safely preserves the proposal when regeneration fails', async () => {
    const proposed = { ...structuredClone(aiPlanFixture), decisions: [{ id: 1, action: 'edited' as const, field_path: 'objective', proposed_value: 'Estudiar', chosen_value: 'Repasar', created_at: planFixture.created_at }] }
    const setup = studyPlanSetup({ path: '/app/study-plans/4', plans: [proposed] })
    expect(await screen.findByText(/Editaste objetivo/)).toBeVisible()
    expect(screen.getByText('Valor propuesto')).toBeVisible()
    expect(screen.getByText('Valor elegido')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Pedir otra propuesta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Tu plan actual se conserva sin cambios')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
    expect(setup.fetch.mock.calls.some(([url]) => String(url).endsWith('/regenerate'))).toBe(true)
    expect(setup.plans[0].decisions).toHaveLength(1)
    expect(setup.plans[0].ai_proposal_snapshot?.explanation).toBe(aiProposalFixture.explanation)
  })

  it('shows the persisted original proposal and suggested missions on a direct detail route', async () => {
    studyPlanSetup({ path: '/app/study-plans/4', plans: [aiPlanFixture] })
    expect(await screen.findByText(aiProposalFixture.explanation)).toBeVisible()
    expect(screen.getByText(aiProposalFixture.reasoning_summary)).toBeVisible()
    expect(screen.getByText(/SUGERENCIA 1/)).toBeVisible()
    expect(screen.getByText('En qué se basa')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Biología' })).toHaveAttribute('href', '/app/subjects/1')
    expect(screen.getByRole('heading', { name: 'Repasar células' })).toBeVisible()
  })

  it('keeps the previous snapshot as readable history when regeneration succeeds', async () => {
    const setup = studyPlanSetup({ path: '/app/study-plans/4', plans: [aiPlanFixture], regenerateStatus: 200 })
    await screen.findByText(aiProposalFixture.explanation)
    await userEvent.click(screen.getByRole('button', { name: 'Pedir otra propuesta' }))
    expect(await screen.findByRole('heading', { name: 'Nueva propuesta' })).toBeVisible()
    expect(screen.getByText('Nueva propuesta solicitada.')).toBeVisible()
    expect(screen.getByText('Valor propuesto')).toBeVisible()
    expect(setup.plans[0].decisions).toHaveLength(1)
    expect(setup.plans[0].decisions[0].proposed_value).toMatchObject({ plan: { name: 'Preparar examen' } })
    expect(setup.plans[0].ai_proposal_snapshot?.plan.name).toBe('Nueva propuesta')
  })

  it('shows no pattern claim with zero completed sessions', async () => {
    const { fetch } = studyPlanSetup({ path: '/app/behavior', behaviorSessionCount: 0 })
    expect(await screen.findByRole('heading', { name: 'Observaciones de tus sesiones' })).toBeVisible()
    expect(await screen.findByText(/hacen falta sesiones para identificar patrones/i)).toBeVisible()
    expect(screen.getByText(/0 sesiones finalizadas/)).toBeVisible()
    expect(screen.getByText('Sigue registrando tus sesiones')).toBeVisible()
    expect(fetch.mock.calls.some(([url, request]) => String(url).endsWith('/analysis/behavior') && request?.method === 'POST')).toBe(true)
  })

  it.each([1, 4])('shows factual entries and questions with %i sessions, without calling them a pattern', async count => {
    studyPlanSetup({ path: '/app/behavior', behaviorSessionCount: count })
    expect(await screen.findByText(`Tienes ${count} sesiones finalizadas registradas.`)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Dato de tus sesiones' })).toBeVisible()
    expect(screen.getByText('¿Qué notas al revisar estas sesiones?')).toBeVisible()
    expect(screen.getByText(/todavía no identifica un patrón/)).toBeVisible()
    expect(screen.queryByText('Una observación para reflexionar')).not.toBeInTheDocument()
  })

  it.each([5, 7])('shows evidence-based observations with %i completed sessions', async count => {
    studyPlanSetup({ path: '/app/behavior', behaviorSessionCount: count })
    expect(await screen.findByRole('heading', { name: 'Una observación para reflexionar' })).toBeVisible()
    expect(screen.getByText(/Dos sesiones comenzaron/)).toBeVisible()
    expect(screen.getByText(/Qué te ayudó a empezar/)).toBeVisible()
    expect(screen.getByText(/se apoya en dos sesiones/)).toBeVisible()
  })

  it('presents behavior observations, evidence, questions and related resource links', async () => {
    studyPlanSetup({ path: '/app/behavior' })
    expect(await screen.findByText(/empezaste con más tiempo/)).toBeVisible()
    expect(screen.getByText(/Dos sesiones comenzaron/)).toBeVisible()
    expect(screen.getByText(/Qué te ayudó a empezar/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Abrir materia relacionada 1' })).toHaveAttribute('href', '/app/subjects/1')
    expect(screen.getByRole('link', { name: 'Abrir actividad relacionada 1' })).toHaveAttribute('href', `/app/activities/${planFixture.activities[0].id}`)
    expect(screen.getByRole('link', { name: 'Abrir sesión relacionada 1' })).toHaveAttribute('href', `/app/sessions/${planFixture.study_sessions[0].id}`)
  })

  it('distinguishes an AI mission and shows its explanation, evidence, condition and linked resource', async () => {
    const mission = { ...challengeFixture, source: 'ai' as const, generation_criteria: { explanation: 'Se sugirió dividir el repaso en pasos breves.', evidence: ['La sesión está vinculada a Biología.'], measurable_condition: 'Completar 30 minutos de repaso.' } }
    studyPlanSetup({ path: '/app/study-plans/4/challenges/8', challenges: [mission] })
    expect(await screen.findByRole('heading', { name: 'Repasar células' })).toBeVisible()
    expect(screen.getByText('MISIÓN SUGERIDA POR COGNOVA')).toBeVisible()
    expect(screen.getByText('Se sugirió dividir el repaso en pasos breves.')).toBeVisible()
    expect(screen.getByText('La sesión está vinculada a Biología.')).toBeVisible()
    expect(screen.getByText(/Completar 30 minutos de repaso/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Biología' })).toHaveAttribute('href', '/app/subjects/1')
  })

  it('honors Retry-After without exposing provider details', async () => {
    studyPlanSetup({ path: '/app/behavior', behaviorStatus: 503 })
    expect(await screen.findByRole('alert')).toHaveTextContent('Espera 30 segundos')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
  })

  it('handles a 429 Gemini rate limit and a general 503 safely', async () => {
    studyPlanSetup({ path: '/app/behavior', behaviorStatus: 429 })
    expect(await screen.findByRole('alert')).toHaveTextContent('Espera 30 segundos')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
  })

  it('shows a safe general provider error without leaking response details', async () => {
    studyPlanSetup({ path: '/app/behavior', behaviorStatus: 503, behaviorCode: 'PROVIDER_UNAVAILABLE' })
    expect(await screen.findByRole('alert')).toHaveTextContent('El servicio no está disponible por ahora')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
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
