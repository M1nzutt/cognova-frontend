import type { QuestionnaireAnswer, QuestionnaireQuestion as Question } from '../types/questionnaire'
import styles from './Questionnaire.module.css'

interface Props { question: Question; answer?: QuestionnaireAnswer; onChange: (answer: QuestionnaireAnswer) => void; disabled: boolean; error: string | null }
export function QuestionnaireQuestion({ question, answer = { choices: [] }, onChange, disabled, error }: Props) {
  const multi = question.selection === 'multi'
  const full = answer.choices.length >= question.max_choices
  function choose(id: string) {
    const choices = multi ? answer.choices.includes(id) ? answer.choices.filter(value => value !== id)
      : full ? answer.choices : [...answer.choices, id] : [id]
    onChange({ choices, ...(choices.includes('other') ? { other_text: answer.other_text ?? '' } : {}) })
  }
  return <fieldset className={styles.question} disabled={disabled} aria-describedby={`${question.id}-hint${error ? ` ${question.id}-error` : ''}`}>
    <legend>{question.text}</legend>
    <p id={`${question.id}-hint`} className={styles.hint}>{multi ? `Elige entre 1 y ${question.max_choices} opciones. ${answer.choices.length} seleccionadas.` : 'Elige una opción.'}</p>
    <div className={styles.options}>
      {question.options.map(option => {
        const checked = answer.choices.includes(option.id)
        return <label key={option.id} className={styles.option}>
          <input type={multi ? 'checkbox' : 'radio'} name={question.id} value={option.id} checked={checked}
            disabled={disabled || (multi && full && !checked)} onChange={() => choose(option.id)} />
          <span>{option.label}</span>
        </label>
      })}
    </div>
    {multi && full && <p className={styles.hint}>Has llegado al máximo. Desmarca una opción para elegir otra.</p>}
    {answer.choices.includes('other') && <div className={styles.other}><label htmlFor={`${question.id}-other`}>Cuéntanos cuál</label>
      <input id={`${question.id}-other`} value={answer.other_text ?? ''} maxLength={50} required aria-describedby={`${question.id}-other-hint`}
        onChange={event => onChange({ ...answer, other_text: event.target.value })} />
      <span id={`${question.id}-other-hint`} className={styles.hint}>{[...(answer.other_text ?? '')].length}/50 caracteres</span>
    </div>}
    {error && <p role="alert" id={`${question.id}-error`}>{error}</p>}
  </fieldset>
}
