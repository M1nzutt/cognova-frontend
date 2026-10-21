import { useState } from 'react'
import type { SubjectCatalog, SubjectDifficulty, SubjectWrite } from '../types/subject'
import { colorLabels, difficultyLabels } from '../utils/subjectPresentation'
import styles from './Subjects.module.css'
interface Props { catalog: SubjectCatalog; initial?: SubjectWrite; busy: boolean; error: string; onSave: (value: SubjectWrite) => void; onCancel: () => void }
export function SubjectForm({ catalog, initial, busy, error, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<SubjectWrite>({ name: initial?.name ?? '', difficulty: initial?.difficulty ?? 'medium', color_base: initial?.color_base ?? catalog.color_bases[0], color_shade: initial?.color_shade ?? catalog.color_shades[0] })
  const [validation, setValidation] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const name = draft.name.trim()
    if (!name || [...name].length > 20) { setValidation('Escribe un nombre de entre 1 y 20 caracteres.'); return }
    if (!catalog.color_bases.includes(draft.color_base) || !catalog.color_shades.includes(draft.color_shade)) { setValidation('Selecciona un color y un tono disponibles.'); return }
    setValidation(''); onSave({ ...draft, name })
  }
  return <form onSubmit={submit} className={styles.form} aria-label={initial ? 'Editar materia' : 'Crear materia'}>
    <fieldset disabled={busy}>
      <label htmlFor="subject-name">Nombre</label>
      <input id="subject-name" value={draft.name} aria-describedby="name-hint" aria-invalid={!!validation} onChange={e => setDraft({ ...draft, name: e.target.value })} autoComplete="off" required />
      <small id="name-hint">Máximo 20 caracteres · {[...draft.name.trim()].length}/20</small>
      <label htmlFor="subject-difficulty">Dificultad</label>
      <select id="subject-difficulty" value={draft.difficulty} onChange={e => setDraft({ ...draft, difficulty: e.target.value as SubjectDifficulty })}>
        {Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <div className={styles.columns}>
        <div><label htmlFor="subject-color">Color</label><select id="subject-color" value={draft.color_base} onChange={e => setDraft({ ...draft, color_base: e.target.value })}>{catalog.color_bases.map(c => <option key={c} value={c}>{colorLabels[c] ?? 'Color disponible'}</option>)}</select></div>
        <div><label htmlFor="subject-shade">Tono</label><select id="subject-shade" value={draft.color_shade} onChange={e => setDraft({ ...draft, color_shade: Number(e.target.value) })}>{catalog.color_shades.map((s, i) => <option key={s} value={s}>{['Muy suave', 'Suave', 'Medio', 'Intenso', 'Muy intenso'][i] ?? 'Tono ' + (i + 1)}</option>)}</select></div>
      </div>
      <p className={styles.preview}><span className={styles.swatch} data-color={draft.color_base} data-shade={draft.color_shade} aria-hidden="true" />{draft.name.trim() || 'Tu materia'} · {difficultyLabels[draft.difficulty]}</p>
    </fieldset>
    {(validation || error) && <p className={styles.error} role="alert">{validation || error}</p>}
    <div className="actions"><button className={styles.primary} disabled={busy} type="submit">{busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear materia'}</button><button className="button" type="button" disabled={busy} onClick={onCancel}>Cancelar</button></div>
  </form>
}
