import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'
import { studySessionSetup } from '../test/studySessionSetup'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})

describe('study session detail and timer lifecycle', () => {
  it('runs start, two pauses, resumes, and finish with server-confirmed time and intervals', async () => {
    const { fetch } = studySessionSetup({ path: '/app/sessions/8' })
    expect(await screen.findByRole('heading', { name: 'Sesión de Biología' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('button', { name: 'Pausar' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(await screen.findByLabelText('Tiempo efectivo 10:00')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Reanudar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Pausar' }))
    expect(await screen.findByLabelText('Tiempo efectivo 15:00')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Reanudar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Finalizar sesión' }))
    await userEvent.selectOptions(screen.getByLabelText('Resultado'), 'partial')
    await userEvent.selectOptions(screen.getByLabelText('¿Cómo terminó? (opcional)'), 'other')
    await userEvent.type(screen.getByLabelText('Cuéntanos brevemente (opcional)'), 'Me distraje y retomé el estudio')
    await userEvent.click(screen.getByRole('checkbox', { name: /Confirmo/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar resultado' }))
    expect(await screen.findByText('Sesión finalizada y sincronizada.')).toBeVisible()
    expect(screen.getByText('Parcial')).toBeVisible()
    expect(screen.getByText('Otro')).toBeVisible()
    expect(screen.getByText('Me distraje y retomé el estudio')).toBeVisible()
    expect(screen.getByLabelText('Tiempo efectivo 20:00')).toBeVisible()
    expect(screen.getAllByText(/Tramo [123]/)).toHaveLength(3)
    const operations = fetch.mock.calls.map(([url, request]) => `${request?.method ?? 'GET'} ${String(url)}`)
    expect(operations.some(value => value.includes('/sessions/8/start'))).toBe(true)
    expect(operations.some(value => value.includes('/sessions/8/pause'))).toBe(true)
    expect(operations.some(value => value.includes('/sessions/8/resume'))).toBe(true)
    const finish = fetch.mock.calls.find(([url]) => String(url).endsWith('/sessions/8/finish'))
    expect(JSON.parse(String(finish?.[1]?.body))).toEqual({ status: 'partial', context: 'other', other_text: 'Me distraje y retomé el estudio' })
    expect(operations.filter(value => value.startsWith('POST') && value.includes('/sessions/8/')).length).toBe(6)
  })

  it('shows a recoverable 409 and reloads current state instead of repeating start', async () => {
    const { fetch } = studySessionSetup({ path: '/app/sessions/8', startStatus: 409 })
    await screen.findByRole('heading', { name: 'Sesión de Biología' })
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('otra en curso')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail')
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled()
    expect(fetch.mock.calls.filter(([url, request]) => String(url).endsWith('/sessions/8/start') && request?.method === 'POST').length).toBe(1)
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/sessions/8'))).toBe(true)
  })

  it('supports closing a plan as cancelled without creating execution intervals', async () => {
    const { fetch } = studySessionSetup({ path: '/app/sessions/8' })
    await screen.findByRole('heading', { name: 'Sesión de Biología' })
    await userEvent.click(screen.getByRole('button', { name: 'Postergar o cancelar' }))
    await userEvent.selectOptions(screen.getByLabelText('Resultado'), 'cancelled')
    await userEvent.click(screen.getByRole('checkbox', { name: /Confirmo/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar resultado' }))
    expect(await screen.findByText('Cancelada')).toBeVisible()
    expect(fetch.mock.calls.find(([url]) => String(url).endsWith('/sessions/8/finish'))?.[1]?.body).toBe(JSON.stringify({ status: 'cancelled', context: null, other_text: null }))
    expect(screen.getByText('Aún no inicia')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Intervalos de ejecución' })).not.toBeInTheDocument()
  })

  it('supports postponing a plan without starting a timer', async () => {
    const { fetch } = studySessionSetup({ path: '/app/sessions/8' })
    await screen.findByRole('heading', { name: 'Sesión de Biología' })
    await userEvent.click(screen.getByRole('button', { name: 'Postergar o cancelar' }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Confirmo/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar resultado' }))
    expect(await screen.findByText('Postergada')).toBeVisible()
    expect(fetch.mock.calls.find(([url]) => String(url).endsWith('/sessions/8/finish'))?.[1]?.body).toBe(JSON.stringify({ status: 'postponed', context: null, other_text: null }))
    expect(screen.getByText('0:00 confirmados por el servidor')).toBeVisible()
  })

  it('finishes executed work as completed and records a predefined context', async () => {
    const { fetch } = studySessionSetup({ path: '/app/sessions/8' })
    await screen.findByRole('heading', { name: 'Sesión de Biología' })
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Finalizar sesión' }))
    await userEvent.selectOptions(screen.getByLabelText('¿Cómo terminó? (opcional)'), 'finished_early')
    await userEvent.click(screen.getByRole('checkbox', { name: /Confirmo/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar resultado' }))
    expect(await screen.findByText('Completada')).toBeVisible()
    expect(screen.getByText('Terminé antes')).toBeVisible()
    expect(fetch.mock.calls.find(([url]) => String(url).endsWith('/sessions/8/finish'))?.[1]?.body).toBe(JSON.stringify({ status: 'completed', context: 'finished_early', other_text: null }))
  })

  it('restores keyboard focus to the finish trigger when the dialog is cancelled', async () => {
    studySessionSetup({ path: '/app/sessions/8' })
    const trigger = await screen.findByRole('button', { name: 'Postergar o cancelar' })
    await userEvent.click(trigger)
    const dialog = screen.getByRole('dialog')
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('safe study plan deletion', () => {
  it('deletes only an unstarted plan after a serious confirmation', async () => {
    const setup = studySessionSetup({ path: '/app/sessions/8' })
    await screen.findByRole('heading', { name: 'Sesión de Biología' })
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar plan sin iniciar' }))
    const submit = screen.getByRole('button', { name: 'Eliminar plan' })
    expect(submit).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox', { name: /Entiendo/ }))
    await userEvent.click(submit)
    expect(await screen.findByText('No hay sesiones con estos filtros')).toBeVisible()
    expect(setup.sessions).toHaveLength(0)
    const remove = setup.fetch.mock.calls.find(([, request]) => request?.method === 'DELETE')
    expect(new URL(String(remove?.[0]), 'https://test').searchParams.get('confirm')).toBe('true')
  })

  it('preserves a record and explains the history conflict when delete returns 409', async () => {
    const { sessions } = studySessionSetup({ path: '/app/sessions/8', deleteStatus: 409 })
    await screen.findByRole('heading', { name: 'Sesión de Biología' })
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar plan sin iniciar' }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Entiendo/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar plan' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('ya inició o tiene historial')
    expect(sessions).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Sesión de Biología' })).toBeVisible()
    expect(screen.getByRole('dialog')).toBeVisible()
  })
})
