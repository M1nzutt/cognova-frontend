import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { AppRoutes } from '../routes/AppRoutes'
import { catalog, response } from '../test/questionnaireFixtures'
import { jsonResponse, makeToken, user } from '../test/authFixtures'
import type { QuestionnaireResponse } from '../types/questionnaire'

const incomplete = { ...user, onboarding: { status: 'incomplete', academic_profile_complete: true, questionnaire_complete: false, next_step: 'questionnaire' } }
function setup(options: { initial?: QuestionnaireResponse; failCatalog?: boolean; conflict?: boolean; syncFailure?: boolean } = {}) {
  let current = options.initial ?? null
  let failCatalog = options.failCatalog ?? false
  let conflict = options.conflict ?? false
  let syncFailure = options.syncFailure ?? false
  let written = false
  const fetch = vi.fn(async (url: string, request: RequestInit = {}) => {
    if (url.endsWith('/refresh')) return jsonResponse({ access_token: makeToken(), token_type: 'bearer' })
    if (url.endsWith('/me')) {
      if (written && syncFailure) { syncFailure = false; return jsonResponse({}, 503) }
      return jsonResponse(current ? user : incomplete)
    }
    if (url.endsWith('/catalog')) {
      if (failCatalog) return jsonResponse({}, 503)
      return jsonResponse(catalog)
    }
    if (url.includes('/history')) return jsonResponse({ items: current ? [current] : [], next_before_revision: null })
    if (url.endsWith('/questionnaire') && (!request.method || request.method === 'GET')) return current ? jsonResponse(current) : jsonResponse({ error: { code: 'QUESTIONNAIRE_NOT_FOUND' } }, 404)
    if (url.endsWith('/questionnaire')) {
      const payload = JSON.parse(String(request.body))
      if (conflict) { conflict = false; current = { ...response, revision: 2 }; return jsonResponse({ error: { code: 'QUESTIONNAIRE_VERSION_CONFLICT' } }, 409) }
      current = { ...response, ...payload, revision: (current?.revision ?? 0) + 1 }; written = true
      return jsonResponse(current, request.method === 'POST' ? 201 : 200)
    }
    throw new Error(`Unexpected URL ${url}`)
  })
  vi.stubGlobal('fetch', fetch); document.cookie = 'cognova_csrf=test; Path=/'
  render(<StrictMode><MemoryRouter initialEntries={[current ? '/app/questionnaire' : '/onboarding/questionnaire']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></StrictMode>)
  return { fetch, recoverCatalog: () => { failCatalog = false } }
}
async function finishQuestions(select = true) {
  for (let index=0; index<10; index++) {
    const question=catalog.questions[index]
    await screen.findByText(question.text)
    if (select) fireEvent.click(screen.getByLabelText(question.options[0].label))
    if (index<9) fireEvent.click(screen.getByRole('button',{name:'Continuar'}))
  }
}
const writes = (fetch: ReturnType<typeof setup>['fetch']) => fetch.mock.calls.filter(([,request])=>['POST','PUT'].includes(request?.method ?? '') && request?.body)

describe('questionnaire UI with real auth state and intercepted API', () => {
  it('loads the ten-question catalog, creates once and enters the app', async () => {
    const {fetch}=setup()
    expect(screen.getByRole('status')).toHaveTextContent('Comprobando tu sesión')
    await finishQuestions()
    expect(screen.getByText('Pregunta 10 de 10 · 10 respondidas')).toBeVisible()
    fireEvent.click(screen.getByRole('button',{name:'Guardar percepción inicial'}))
    expect(await screen.findByText('Has iniciado sesión correctamente.')).toBeVisible()
    expect(writes(fetch)).toHaveLength(1)
    const payload=JSON.parse(String(writes(fetch)[0][1]!.body))
    expect(payload.questionnaire_version).toBe(1)
    expect(Object.keys(payload.answers)).toHaveLength(10)
    expect(payload).not.toHaveProperty('expected_revision')
    expect(localStorage.getItem('questionnaire')).toBeNull()
  })
  it('validates missing and Other answers, preserves back navigation and clears unused Other', async () => {
    setup()
    await screen.findByText(catalog.questions[0].text)
    fireEvent.click(screen.getByRole('button',{name:'Continuar'}))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona una respuesta')
    fireEvent.click(screen.getByLabelText('Otro'))
    fireEvent.click(screen.getByRole('button',{name:'Continuar'}))
    expect(screen.getByRole('alert')).toHaveTextContent('Describe tu respuesta')
    fireEvent.change(screen.getByLabelText('Cuéntanos cuál'),{target:{value:'a'.repeat(51)}})
    fireEvent.click(screen.getByRole('button',{name:'Continuar'}))
    expect(screen.getByRole('alert')).toHaveTextContent('50 caracteres')
    fireEvent.change(screen.getByLabelText('Cuéntanos cuál'),{target:{value:'Mi meta'}})
    fireEvent.click(screen.getByRole('button',{name:'Continuar'}))
    fireEvent.click(screen.getByRole('button',{name:'Volver'}))
    expect(screen.getByLabelText('Cuéntanos cuál')).toHaveValue('Mi meta')
    fireEvent.click(screen.getByLabelText(catalog.questions[0].options[0].label))
    expect(screen.queryByLabelText('Cuéntanos cuál')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Continuar'}))
    expect(screen.getByText(catalog.questions[1].text)).toBeVisible()
  })
  it('loads an existing response, preserves local edits on 409 and explicitly retries the latest revision', async () => {
    const {fetch}=setup({initial:response,conflict:true})
    await screen.findByText(catalog.questions[0].text)
    fireEvent.click(screen.getByLabelText(catalog.questions[0].options[1].label))
    await finishQuestions(false)
    fireEvent.click(screen.getByRole('button',{name:'Guardar nueva revisión'}))
    const retry=await screen.findByRole('button',{name:'Guardar mis respuestas sobre revisión 2'})
    expect(screen.getByRole('region',{name:'Conflicto de revisión'})).toHaveTextContent('Conservamos tus respuestas locales')
    expect(writes(fetch)).toHaveLength(1)
    fireEvent.click(retry)
    expect(await screen.findByText('Revisión 3 guardada correctamente.')).toBeVisible()
    const payloads=writes(fetch).map(([,r])=>JSON.parse(String(r!.body)))
    expect(payloads.map(p=>p.expected_revision)).toEqual([1,2])
    expect(payloads[1].answers.q1.choices).toEqual([catalog.questions[0].options[1].id])
    fireEvent.click(screen.getByRole('button',{name:'Consultar revisiones'}))
    expect(await screen.findByText(/Revisión 3 ·/)).toBeVisible()
  })
  it('offers a safe load retry after catalog failure', async () => {
    const controller=setup({failCatalog:true})
    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no está disponible')
    controller.recoverCatalog()
    fireEvent.click(screen.getByRole('button',{name:'Reintentar cuestionario'}))
    expect(await screen.findByText(catalog.questions[0].text)).toBeVisible()
  })
  it('does not repeat a successful POST when syncing onboarding fails', async () => {
    const {fetch}=setup({syncFailure:true})
    await finishQuestions()
    fireEvent.click(screen.getByRole('button',{name:'Guardar percepción inicial'}))
    const retry=await screen.findByRole('button',{name:'Reintentar actualización de cuenta'})
    await waitFor(()=>expect(retry).toBeEnabled())
    expect(screen.getByText('Revisión 1 guardada correctamente.')).toBeVisible()
    fireEvent.click(retry)
    expect(await screen.findByText('Has iniciado sesión correctamente.')).toBeVisible()
    expect(writes(fetch)).toHaveLength(1)
  })
})
