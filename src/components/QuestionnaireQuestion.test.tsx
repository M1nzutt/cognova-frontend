import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QuestionnaireQuestion } from './QuestionnaireQuestion'
import { catalog } from '../test/questionnaireFixtures'
import type { QuestionnaireAnswer } from '../types/questionnaire'

function Question({id}:{id:string}) {
  const [answer,setAnswer]=useState<QuestionnaireAnswer>({choices:[]})
  return <QuestionnaireQuestion question={catalog.questions.find(q=>q.id===id)!} answer={answer} onChange={setAnswer} disabled={false} error={null} />
}
describe('selection controls',()=>{
  it.each(['q6','q7','q10'])('%s enforces its selection limit and permits replacement',id=>{
    render(<Question id={id} />)
    const question=catalog.questions.find(q=>q.id===id)!
    for (const option of question.options.slice(0,question.max_choices)) fireEvent.click(screen.getByLabelText(option.label))
    const next=screen.getByLabelText(question.options[question.max_choices].label)
    expect(next).toBeDisabled()
    fireEvent.click(screen.getByLabelText(question.options[0].label))
    expect(next).toBeEnabled()
    fireEvent.click(next)
    expect(next).toBeChecked()
  })
  it('uses radios for single choice and replaces the selection',()=>{
    render(<Question id="q1" />)
    const radios=screen.getAllByRole('radio')
    fireEvent.click(radios[0]); fireEvent.click(radios[1])
    expect(radios[0]).not.toBeChecked(); expect(radios[1]).toBeChecked()
  })
})
