import { StrictMode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { AppRoutes } from './AppRoutes'
import { jsonResponse, makeToken, user } from '../test/authFixtures'
import { catalog } from '../test/questionnaireFixtures'
import type { AuthUser } from '../types/auth'

const pending: AuthUser = { ...user, degree_program: null, semester: null, onboarding: { status: 'incomplete', academic_profile_complete: false, questionnaire_complete: false, next_step: 'academic_profile' } }
function mount(path: string, initial = pending, restore = true) {
  let profile = initial
  const fetch = vi.fn(async (url: string, options: RequestInit = {}) => {
    if(url.endsWith('/refresh')) return jsonResponse({access_token:makeToken(),token_type:'bearer'})
    if(url.endsWith('/login')) return jsonResponse({user:profile,access_token:makeToken(),token_type:'bearer'})
    if(url.endsWith('/me')) return jsonResponse(profile)
    if(url.endsWith('/logout')) return new Response(null,{status:204})
    if(url.endsWith('/academic-profile')) { profile={...profile,...JSON.parse(String(options.body)),onboarding:{status:'incomplete',academic_profile_complete:true,questionnaire_complete:false,next_step:'questionnaire'}};return jsonResponse(profile) }
    if(url.endsWith('/catalog')) return jsonResponse(catalog)
    if(url.endsWith('/questionnaire')) return jsonResponse({error:{code:'QUESTIONNAIRE_NOT_FOUND'}},404)
    throw Error(url)
  })
  vi.stubGlobal('fetch',fetch)
  if(restore) document.cookie='cognova_csrf=csrf; Path=/'
  const view=render(<StrictMode><MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></StrictMode>)
  return {fetch,view}
}
describe('explicit onboarding navigation',()=>{
  it.each(['/dashboard','/onboarding/academic-profile','/login'])('restores incomplete profile from %s',async path=>{
    mount(path)
    expect(await screen.findByRole('heading',{name:'Tu perfil académico'})).toBeVisible()
    expect(screen.queryByText('Has iniciado sesión correctamente.')).not.toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
  it('saves the academic profile and follows the returned next_step',async()=>{
    const {fetch}=mount('/onboarding/academic-profile')
    fireEvent.change(await screen.findByLabelText('Carrera'),{target:{value:'  Ingeniería  '}})
    fireEvent.change(screen.getByLabelText('Semestre'),{target:{value:'2'}})
    fireEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}))
    expect(await screen.findByText(catalog.questions[0].text)).toBeVisible()
    const call=fetch.mock.calls.find(([url])=>url.endsWith('/academic-profile'))!
    expect(JSON.parse(String(call[1]!.body))).toEqual({degree_program:'Ingeniería',semester:2})
  })
  it('restores a completed profile directly to questionnaire',async()=>{
    mount('/dashboard',{...user,onboarding:{...pending.onboarding,academic_profile_complete:true,next_step:'questionnaire'}})
    expect(await screen.findByText(catalog.questions[0].text)).toBeVisible()
    expect(screen.queryByLabelText('Carrera')).not.toBeInTheDocument()
  })
  it.each(['/onboarding/academic-profile','/onboarding/questionnaire'])('complete user leaves %s',async path=>{
    mount(path,user)
    expect(await screen.findByText('Has iniciado sesión correctamente.')).toBeVisible()
  })
  it('logs incomplete users in to their pending step and supports logout',async()=>{
    const {fetch}=mount('/login',pending,false)
    fireEvent.change(await screen.findByLabelText('Correo electrónico'),{target:{value:user.email}})
    fireEvent.change(screen.getByLabelText('Contraseña'),{target:{value:'Example123!'}})
    fireEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}))
    expect(await screen.findByRole('heading',{name:'Tu perfil académico'})).toBeVisible()
    document.cookie='cognova_csrf=csrf; Path=/'
    fireEvent.click(screen.getByRole('button',{name:'Cerrar sesión'}))
    expect(await screen.findByRole('heading',{name:'Inicia sesión'})).toBeVisible()
    expect(fetch.mock.calls.some(([url])=>url.endsWith('/logout'))).toBe(true)
  })
  it('keeps academic inputs on API error and permits explicit retry',async()=>{
    const {fetch}=mount('/onboarding/academic-profile')
    fireEvent.change(await screen.findByLabelText('Carrera'),{target:{value:'Medicina'}})
    fireEvent.change(screen.getByLabelText('Semestre'),{target:{value:'1'}})
    fetch.mockResolvedValueOnce(jsonResponse({error:{code:'LEGACY_PROFILE_REMEDIATION_REQUIRED'}},409))
    fireEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('datos históricos')
    expect(screen.getByLabelText('Carrera')).toHaveValue('Medicina')
    expect(screen.getByRole('button',{name:'Guardar y continuar'})).toBeEnabled()
  })
})
