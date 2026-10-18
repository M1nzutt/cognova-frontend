import { describe, expect, it } from 'vitest'
import { catalog, response } from '../test/questionnaireFixtures'
import { questionnaireRequest, validateAnswer } from './questionnaireValidation'
import { readCatalog, readHistory, readQuestionnaire } from './readQuestionnaire'

describe('questionnaire cardinality and Other', () => {
  it.each(catalog.questions)('$id requires between $min_choices and $max_choices choices', q => {
    expect(validateAnswer(q)).toBeTruthy()
    expect(validateAnswer(q, { choices: [] })).toBeTruthy()
    expect(validateAnswer(q, { choices: q.options.slice(0, q.max_choices).map(o=>o.id) })).toBeNull()
    expect(validateAnswer(q, { choices: q.options.slice(0, q.max_choices+1).map(o=>o.id) })).toBeTruthy()
  })
  it('rejects duplicate and unknown IDs without normalizing them', () => {
    const q=catalog.questions[5]
    expect(validateAnswer(q,{choices:['distractions','distractions']})).toBeTruthy()
    expect(validateAnswer(q,{choices:[' distractions ']})).toBeTruthy()
  })
  it.each(['q1','q6','q7'])('%s requires trimmed Other with at most 50 characters', id => {
    const q=catalog.questions.find(q=>q.id===id)!
    expect(validateAnswer(q,{choices:['other'],other_text:'  '})).toBeTruthy()
    expect(validateAnswer(q,{choices:['other'],other_text:'a'.repeat(50)})).toBeNull()
    expect(validateAnswer(q,{choices:['other'],other_text:'a'.repeat(51)})).toBeTruthy()
    expect(validateAnswer(q,{choices:[q.options[0].id],other_text:''})).toBeTruthy()
  })
  it('requires all ten answers and only sends applicable Other text', () => {
    expect(()=>questionnaireRequest(catalog,{})).toThrow()
    const request=questionnaireRequest(catalog,{...response.answers,q1:{choices:['other'],other_text:'  Mi meta  '}})
    expect(request.answers.q1).toEqual({choices:['other'],other_text:'Mi meta'})
    expect(request.answers.q2).not.toHaveProperty('other_text')
    expect(Object.keys(request.answers)).toHaveLength(10)
  })
})
describe('runtime contract readers', () => {
  it('reads the complete catalog and rejects missing/duplicate questions and versions', () => {
    expect(readCatalog(catalog)).toEqual(catalog)
    expect(()=>readCatalog({...catalog,questionnaire_version:2})).toThrow()
    expect(()=>readCatalog({...catalog,questions:[]})).toThrow()
    expect(()=>readCatalog({...catalog,questions:catalog.questions.map(()=>catalog.questions[0])})).toThrow()
  })
  it('rejects malformed saved answers and nonmonotonic history', () => {
    expect(readQuestionnaire(response)).toEqual(response)
    expect(()=>readQuestionnaire({...response,answers:{}})).toThrow()
    expect(()=>readHistory({items:[response,response],next_before_revision:null})).toThrow()
    expect(()=>readHistory({items:[response],next_before_revision:3})).toThrow()
  })
})
