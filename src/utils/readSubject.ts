import { ApiError } from '../api/ApiError'
import type { Subject, SubjectCatalog, SubjectList } from '../types/subject'
const invalid = (): never => { throw new ApiError('No pudimos leer tus materias. Inténtalo de nuevo.', 0, 'INVALID_RESPONSE') }
const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : invalid()
const id = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v > 0 && v <= 2147483647
export function readSubject(value: unknown): Subject {
  const v = object(value)
  if (!id(v.id) || typeof v.name !== 'string' || !v.name.trim() || [...v.name].length > 20
    || !['easy', 'medium', 'hard'].includes(String(v.difficulty)) || !['active', 'archived'].includes(String(v.status))
    || typeof v.color_base !== 'string' || !/^[a-z]+$/.test(v.color_base) || !id(v.color_shade)
    || typeof v.created_at !== 'string' || !Number.isFinite(Date.parse(v.created_at))
    || typeof v.updated_at !== 'string' || !Number.isFinite(Date.parse(v.updated_at))) return invalid()
  return v as unknown as Subject
}
export function readSubjectCatalog(value: unknown): SubjectCatalog {
  const v = object(value)
  if (v.version !== 1 || !Array.isArray(v.color_bases) || !v.color_bases.length
    || !v.color_bases.every(c => typeof c === 'string' && /^[a-z]+$/.test(c))
    || !Array.isArray(v.color_shades) || !v.color_shades.length || !v.color_shades.every(id)) return invalid()
  return v as unknown as SubjectCatalog
}
export function readSubjectList(value: unknown): SubjectList {
  const v = object(value)
  if (!Array.isArray(v.items) || (v.next_after_id !== null && !id(v.next_after_id))) return invalid()
  const items = v.items.map(readSubject)
  if (items.some((item, i) => i > 0 && item.id <= items[i-1].id)
    || (v.next_after_id !== null && (!items.length || v.next_after_id !== items.at(-1)?.id))) return invalid()
  return { items, next_after_id: v.next_after_id as number | null }
}
