import { ApiError } from '../api/ApiError'
import { questionIds } from '../types/questionnaire'
import type { QuestionnaireCatalog, QuestionnaireHistory, QuestionnaireResponse } from '../types/questionnaire'

function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function invalid(): never { throw new ApiError('El servidor devolvió un cuestionario incompatible. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE') }
const positiveInteger = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0

export function readCatalog(value: unknown): QuestionnaireCatalog {
  if (!record(value) || value.questionnaire_version !== 1 || !Array.isArray(value.questions) || value.questions.length !== 10) return invalid()
  const ids = new Set<string>()
  for (const item of value.questions) {
    if (!record(item) || typeof item.id !== 'string' || !questionIds.some(id => id === item.id) || ids.has(item.id)
      || typeof item.text !== 'string' || !item.text || !['single', 'multi'].includes(String(item.selection))
      || item.min_choices !== 1 || !positiveInteger(item.max_choices)
      || (item.selection === 'single' && item.max_choices !== 1)
      || !Array.isArray(item.options) || item.options.length < item.max_choices) return invalid()
    ids.add(item.id)
    const options = new Set<string>()
    for (const option of item.options) {
      if (!record(option) || typeof option.id !== 'string' || !option.id || options.has(option.id) || typeof option.label !== 'string' || !option.label) return invalid()
      options.add(option.id)
    }
  }
  return value as unknown as QuestionnaireCatalog
}

export function readQuestionnaire(value: unknown): QuestionnaireResponse {
  if (!record(value) || value.questionnaire_version !== 1 || !positiveInteger(value.revision)
    || typeof value.recorded_at !== 'string' || !Number.isFinite(Date.parse(value.recorded_at))
    || !record(value.answers) || Object.keys(value.answers).length !== 10) return invalid()
  for (const id of questionIds) {
    const answer = value.answers[id]
    if (!record(answer) || !Array.isArray(answer.choices) || !answer.choices.length || answer.choices.some(c => typeof c !== 'string')
      || new Set(answer.choices).size !== answer.choices.length || (answer.other_text != null && typeof answer.other_text !== 'string')) return invalid()
  }
  return value as unknown as QuestionnaireResponse
}

export function readHistory(value: unknown): QuestionnaireHistory {
  if (!record(value) || !Array.isArray(value.items) || (value.next_before_revision !== null && !positiveInteger(value.next_before_revision))) return invalid()
  const items = value.items.map(readQuestionnaire)
  if (items.some((item, index) => index > 0 && item.revision >= items[index - 1].revision)) return invalid()
  if (value.next_before_revision !== null && value.next_before_revision !== items.at(-1)?.revision) return invalid()
  return { items, next_before_revision: value.next_before_revision as number | null }
}
