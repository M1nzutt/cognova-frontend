import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/ApiError'
import { AcademicChatPage } from './AcademicChatPage'

const mocks = vi.hoisted(() => ({ service: undefined as unknown }))
vi.mock('../hooks/useAcademicChatService', () => ({
  useAcademicChatService: () => mocks.service,
}))

function serviceMock() {
  return {
    listConversations: vi.fn().mockResolvedValue([]),
    createConversation: vi.fn().mockResolvedValue({
      id: 12,
      title: 'Nueva conversación',
      created_at: '2030-01-01T12:00:00Z',
      updated_at: '2030-01-01T12:00:00Z',
    }),
    messages: vi.fn().mockResolvedValue({ items: [], next_before_id: null }),
    send: vi.fn().mockResolvedValue({
      conversation: {
        id: 12,
        title: '¿Qué priorizo?',
        created_at: '2030-01-01T12:00:00Z',
        updated_at: '2030-01-01T12:01:00Z',
      },
      user_message: {
        id: 3,
        role: 'user',
        content: '¿Qué priorizo?',
        evidence: [],
        created_at: '2030-01-01T12:00:30Z',
      },
      assistant_message: {
        id: 4,
        role: 'assistant',
        content: 'Veo una actividad pendiente. ¿Cuál te conviene iniciar?',
        evidence: ['Actividad Ensayo: estado pending.'],
        created_at: '2030-01-01T12:01:00Z',
      },
    }),
  }
}

describe('AcademicChatPage', () => {
  beforeEach(() => {
    mocks.service = serviceMock()
  })

  it('offers relevant prompts and renders a contextual answer with evidence', async () => {
    const service = mocks.service as ReturnType<typeof serviceMock>
    service.messages.mockResolvedValue({
      items: [
        {
          id: 3,
          role: 'user',
          content: '¿Qué actividad debería priorizar esta semana?',
          evidence: [],
          created_at: '2030-01-01T12:00:30Z',
        },
        {
          id: 4,
          role: 'assistant',
          content: 'Veo una actividad pendiente. ¿Cuál te conviene iniciar?',
          evidence: ['Actividad Ensayo: estado pending.'],
          created_at: '2030-01-01T12:01:00Z',
        },
      ],
      next_before_id: null,
    })
    render(<AcademicChatPage />)
    expect(await screen.findByRole('heading', { name: /IA Cognova/ })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /actividad debería priorizar/i }))

    expect(await screen.findByText(/Veo una actividad pendiente/)).toBeVisible()
    expect(screen.getByText('En qué se basa · 1')).toBeVisible()
    fireEvent.click(screen.getByText('En qué se basa · 1'))
    expect(screen.getByText('Actividad Ensayo: estado pending.')).toBeVisible()
    expect(service.createConversation).toHaveBeenCalledOnce()
    expect(service.send).toHaveBeenCalledWith(
      12,
      '¿Qué actividad debería priorizar esta semana?',
    )
  })

  it('shows provider unavailability and reloads the persisted student message', async () => {
    const service = mocks.service as ReturnType<typeof serviceMock>
    service.send.mockRejectedValue(
      new ApiError('Unavailable', 503, 'ACADEMIC_CHAT_UNAVAILABLE'),
    )
    service.messages.mockResolvedValue({
      items: [{
        id: 5,
        role: 'user',
        content: '¿Cómo organizo mis materias?',
        evidence: [],
        created_at: '2030-01-01T12:00:00Z',
      }],
      next_before_id: null,
    })
    render(<AcademicChatPage />)
    fireEvent.change(await screen.findByLabelText('Escribe tu consulta académica'), {
      target: { value: '¿Cómo organizo mis materias?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Ahora mismo no puedo responder/)
    await waitFor(() => expect(screen.getByText(
      '¿Cómo organizo mis materias?', { selector: 'p' },
    )).toBeVisible())
  })
})
