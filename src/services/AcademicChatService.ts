import { ApiClient } from '../api/client'
import type {
  AcademicChatSend,
  AcademicConversation,
  AcademicMessagePage,
} from '../types/academicChat'

export class AcademicChatService {
  constructor(private readonly client: ApiClient) {}

  async listConversations(signal?: AbortSignal): Promise<AcademicConversation[]> {
    const result = await this.client.request<{ items: AcademicConversation[] }>(
      '/academic-chat/conversations',
      { signal },
    )
    return result.items
  }

  createConversation(signal?: AbortSignal): Promise<AcademicConversation> {
    return this.client.request('/academic-chat/conversations', {
      method: 'POST',
      signal,
    })
  }

  messages(
    conversationId: number,
    beforeId?: number,
    signal?: AbortSignal,
  ): Promise<AcademicMessagePage> {
    return this.client.request(`/academic-chat/conversations/${conversationId}/messages`, {
      query: { limit: 50, ...(beforeId ? { before_id: beforeId } : {}) },
      signal,
    })
  }

  send(
    conversationId: number,
    content: string,
    signal?: AbortSignal,
  ): Promise<AcademicChatSend> {
    return this.client.request(`/academic-chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { content },
      signal,
      timeoutMs: 30_000,
    })
  }
}
