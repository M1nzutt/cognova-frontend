import type { QuestionnaireAnswer, QuestionnaireCatalog, QuestionnaireQuestion, QuestionnaireRequest, QuestionId } from '../types/questionnaire'
import { questionIds } from '../types/questionnaire'

export type QuestionnaireDraft = Partial<Record<QuestionId, QuestionnaireAnswer>>

export function validateAnswer(question: QuestionnaireQuestion, answer?: QuestionnaireAnswer): string | null {
  if (!answer || answer.choices.length < question.min_choices) return 'Selecciona una respuesta para continuar.'
  if (answer.choices.length > question.max_choices) return `Selecciona como máximo ${question.max_choices} opciones.`
  if (new Set(answer.choices).size !== answer.choices.length) return 'No repitas una opción.'
  if (answer.choices.some(id => !question.options.some(option => option.id === id))) return 'Selecciona una opción del catálogo vigente.'
  if (answer.choices.includes('other')) {
    const text = answer.other_text?.trim() ?? ''
    if (!text) return 'Describe tu respuesta en Otro.'
    if ([...text].length > 50) return 'Otro admite hasta 50 caracteres.'
  } else if (answer.other_text != null) return 'El texto de Otro solo corresponde a esa opción.'
  return null
}

export function questionnaireRequest(catalog: QuestionnaireCatalog, draft: QuestionnaireDraft): QuestionnaireRequest {
  const answers = {} as QuestionnaireRequest['answers']
  for (const id of questionIds) {
    const question = catalog.questions.find(item => item.id === id)
    if (!question) throw new Error('El catálogo no contiene todas las preguntas.')
    const answer = draft[id]
    const issue = validateAnswer(question, answer)
    if (issue || !answer) throw new Error(issue ?? 'Completa todas las preguntas.')
    answers[id] = { choices: [...answer.choices], ...(answer.choices.includes('other') ? { other_text: answer.other_text!.trim() } : {}) }
  }
  return { questionnaire_version: catalog.questionnaire_version, answers }
}
