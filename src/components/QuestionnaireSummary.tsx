import type { QuestionnaireCatalog, QuestionnaireResponse } from '../types/questionnaire'
import styles from './Questionnaire.module.css'

export function QuestionnaireSummary({ catalog, response }: { catalog: QuestionnaireCatalog; response: QuestionnaireResponse }) {
  return <dl className={styles.summary}>{catalog.questions.map(question => {
    const answer = response.answers[question.id]
    return <div key={question.id}><dt>{question.text}</dt><dd>{answer.choices.map(choice =>
      choice === 'other' ? `Otro: ${answer.other_text ?? ''}` : question.options.find(option => option.id === choice)?.label ?? choice).join(' · ')}</dd></div>
  })}</dl>
}
