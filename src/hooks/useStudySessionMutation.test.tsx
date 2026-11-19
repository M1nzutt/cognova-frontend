import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/ApiError'
import { GlobalFeedbackProvider } from '../feedback/GlobalFeedback'
import { MemoryRouter } from 'react-router-dom'
import { useStudySessionMutation } from './useStudySessionMutation'

function Harness({ operation, onConflict }: { operation: (signal: AbortSignal) => Promise<string>; onConflict: () => Promise<void> }) {
  const mutation = useStudySessionMutation()
  return <><button disabled={mutation.busy} onClick={() => void mutation.run(operation, value => { document.body.dataset.result = value }, { onConflict })}>Acción</button>{mutation.busy && <span role="status">Sincronizando</span>}{mutation.error && <p role="alert">{mutation.error}</p>}</>
}

function renderHarness(operation: (signal: AbortSignal) => Promise<string>, onConflict: () => Promise<void>) {
  return render(<MemoryRouter initialEntries={['/app/sessions']}><GlobalFeedbackProvider><Harness operation={operation} onConflict={onConflict} /></GlobalFeedbackProvider></MemoryRouter>)
}

describe('study session mutation handling', () => {
  it('handles 409 by synchronizing the resource without exposing server details', async () => {
    const onConflict = vi.fn().mockResolvedValue(undefined)
    const operation = vi.fn().mockRejectedValue(new ApiError('private database detail', 409, 'SESSION_LOCK'))
    renderHarness(operation, onConflict)
    await userEvent.click(screen.getByRole('button', { name: 'Acción' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('otra en curso')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private')
    expect(onConflict).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Acción' })).toBeEnabled()
  })

  it('prevents repeat requests while a transition is pending', async () => {
    let resolve!: (value: string) => void
    const operation = vi.fn(() => new Promise<string>(done => { resolve = done }))
    renderHarness(operation, vi.fn())
    await userEvent.click(screen.getByRole('button', { name: 'Acción' }))
    expect(screen.getByRole('button', { name: 'Acción' })).toBeDisabled()
    expect(operation).toHaveBeenCalledOnce()
    resolve('ok')
  })
})
