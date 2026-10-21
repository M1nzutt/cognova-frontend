export type SubjectStatus = 'active' | 'archived'
export type SubjectDifficulty = 'easy' | 'medium' | 'hard'
export interface SubjectWrite { name: string; difficulty: SubjectDifficulty; color_base: string; color_shade: number }
export interface Subject extends SubjectWrite { id: number; status: SubjectStatus; created_at: string; updated_at: string }
export interface SubjectCatalog { version: 1; color_bases: string[]; color_shades: number[] }
export interface SubjectList { items: Subject[]; next_after_id: number | null }
