import { useCallback } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useStudySessionResource } from './useStudySessionResource'

function Harness({ load }: { load: (signal: AbortSignal) => Promise<string> }) {
  const stableLoad = useCallback(load, [load])
  const resource = useStudySessionResource(stableLoad)
  return <div>{resource.loading && <span role="status">Cargando</span>}{resource.error && <p role="alert">{resource.error}</p>}{resource.data && <p>{resource.data}</p>}<button onClick={resource.retry}>Reintentar</button></div>
}

describe('study session resource states', () => {
  it('shows loading then the synchronized resource', async () => {
    const load = vi.fn().mockResolvedValue('sesión recuperada')
    render(<Harness load={load} />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
    expect(await screen.findByText('sesión recuperada')).toBeVisible()
    expect(load).toHaveBeenCalledOnce()
  })

  it('clears old data on a recoverable failure and retries', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('private failure')).mockResolvedValueOnce('respuesta actual')
    render(<Harness load={load} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos completar')
    expect(screen.queryByText('private failure')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('respuesta actual')).toBeVisible()
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  })
})
