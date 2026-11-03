import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { StudySessionDeleteConfirmation } from './StudySessionDeleteConfirmation'
import { StudySessionFinishDialog } from './StudySessionFinishDialog'
import { studySession, sessionSummary } from '../test/studySessionFixtures'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})

describe('study session confirmations and results', () => {
  it('requires explicit confirmation before postponing or cancelling a plan', async () => {
    const onConfirm = vi.fn()
    render(<StudySessionFinishDialog session={{ ...sessionSummary, other_text: null, intervals: [] }} busy={false} error="" onCancel={vi.fn()} onConfirm={onConfirm} />)
    expect(screen.getByRole('option', { name: 'Postergada' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Cancelada' })).toBeVisible()
    expect(screen.queryByLabelText(/¿Cómo terminó/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar resultado' }))
    expect(onConfirm).toHaveBeenCalledWith({ status: 'postponed', context: null, other_text: null })
  })

  it('offers executed results and only reveals other_text for Otro', async () => {
    const onConfirm = vi.fn()
    render(<StudySessionFinishDialog session={studySession} busy={false} error="" onCancel={vi.fn()} onConfirm={onConfirm} />)
    await userEvent.selectOptions(screen.getByLabelText('¿Cómo terminó? (opcional)'), 'other')
    expect(screen.getByLabelText('Cuéntanos brevemente (opcional)')).toBeVisible()
    await userEvent.type(screen.getByLabelText('Cuéntanos brevemente (opcional)'), 'Me cambié de espacio')
    await userEvent.selectOptions(screen.getByLabelText('Resultado'), 'partial')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar resultado' }))
    expect(onConfirm).toHaveBeenCalledWith({ status: 'partial', context: 'other', other_text: 'Me cambié de espacio' })
  })

  it.each([
    ['finished_early', 'Terminé antes'], ['distracted', 'Me distraje'], ['tired', 'Me cansé'],
    ['interrupted', 'Tuve una interrupción'], ['changed_activity', 'Cambié de actividad'], ['other', 'Otro'],
  ])('maps final context %s to the Spanish label', async (value, label) => {
    render(<StudySessionFinishDialog session={studySession} busy={false} error="" onCancel={vi.fn()} onConfirm={vi.fn()} />)
    await userEvent.selectOptions(screen.getByLabelText('¿Cómo terminó? (opcional)'), value)
    expect(screen.getByLabelText('¿Cómo terminó? (opcional)')).toHaveValue(value)
    if (value === 'other') expect(screen.getByLabelText('Cuéntanos brevemente (opcional)')).toBeVisible()
    else expect(screen.queryByLabelText('Cuéntanos brevemente (opcional)')).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: label })).toBeInTheDocument()
  })

  it('requires an explicit checkbox before deleting an unstarted plan', async () => {
    const onConfirm = vi.fn()
    render(<StudySessionDeleteConfirmation busy={false} error="" onCancel={vi.fn()} onConfirm={onConfirm} />)
    const button = screen.getByRole('button', { name: 'Eliminar plan' })
    expect(button).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox'))
    expect(button).toBeEnabled()
    await userEvent.click(button)
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('keeps a conflict visible and permits keyboard cancellation', () => {
    const onCancel = vi.fn()
    render(<StudySessionDeleteConfirmation busy={false} error="Este plan ya tiene ejecución." onCancel={onCancel} onConfirm={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('ya tiene ejecución')
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
