export const questionIds = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'] as const
export type QuestionId = typeof questionIds[number]

export interface QuestionnaireQuestion {
  id: QuestionId
  text: string
  selection: 'single' | 'multi'
  min_choices: number
  max_choices: number
  options: { id: string; label: string }[]
}

export interface QuestionnaireCatalog {
  questionnaire_version: 1
  questions: QuestionnaireQuestion[]
}

export interface QuestionnaireAnswer {
  choices: string[]
  other_text?: string | null
}

export type QuestionnaireAnswers = Record<QuestionId, QuestionnaireAnswer>
export interface QuestionnaireRequest {
  questionnaire_version: 1
  answers: QuestionnaireAnswers
}
export interface QuestionnaireUpdateRequest extends QuestionnaireRequest {
  expected_revision: number
}
export interface QuestionnaireResponse extends QuestionnaireRequest {
  revision: number
  recorded_at: string
}
export interface QuestionnaireHistory {
  items: QuestionnaireResponse[]
  next_before_revision: number | null
}
