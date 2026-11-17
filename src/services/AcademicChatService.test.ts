import { describe, expect, it, vi } from 'vitest'
import { AcademicChatService } from './AcademicChatService'
import type { ApiClient } from '../api/client'

describe('AcademicChatService', () => {
  it('uses authenticated API routes and bounded message pages', async () => {
    const request = vi.fn().mockResolvedValue({ items: [], next_before_id: null })
    const service = new AcademicChatService({ request } as unknown as ApiClient)

    await service.listConversations()
    await service.createConversation()
    await service.messages(17, 42)
    await service.send(17, '¿Qué priorizo?')

    expect(request.mock.calls.map(([path]) => path)).toEqual([
      '/academic-chat/conversations',
      '/academic-chat/conversations',
      '/academic-chat/conversations/17/messages',
      '/academic-chat/conversations/17/messages',
    ])
    expect(request.mock.calls[0]?.[1]).toEqual({ signal: undefined })
    expect(request.mock.calls[1]?.[1]).toMatchObject({ method: 'POST' })
    expect(request.mock.calls[2]?.[1]).toMatchObject({
      query: { limit: 50, before_id: 42 },
    })
    expect(request.mock.calls[3]?.[1]).toMatchObject({
      method: 'POST',
      body: { content: '¿Qué priorizo?' },
      timeoutMs: 30_000,
    })
    expect(JSON.stringify(request.mock.calls)).not.toContain('GEMINI_API_KEY')
  })
})
