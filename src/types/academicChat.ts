export interface AcademicConversation {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export interface AcademicMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  evidence: string[]
  created_at: string
}

export interface AcademicMessagePage {
  items: AcademicMessage[]
  next_before_id: number | null
}

export interface AcademicChatSend {
  conversation: AcademicConversation
  user_message: AcademicMessage
  assistant_message: AcademicMessage
}
