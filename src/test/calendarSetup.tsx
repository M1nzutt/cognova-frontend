/* eslint-disable react-refresh/only-export-components -- Test-only render harness, never imported by the application. */
import { StrictMode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { AppRoutes } from '../routes/AppRoutes'
import { jsonResponse, makeToken, user } from './authFixtures'
import { calendarItem } from './calendarFixtures'
import { activity } from './activityFixtures'
const subject = { id:1,name:'Álgebra',status:'archived',difficulty:'medium',color_base:'blue',color_shade:200,created_at:activity.created_at,updated_at:activity.updated_at }
function Location() { return <output data-testid="location">{useLocation().search}</output> }
export function calendarSetup(options: { path?: string; anonymous?: boolean; incomplete?: boolean; calendar?: (url: URL, request: RequestInit) => Promise<Response> } = {}) {
  if (!options.anonymous) document.cookie = 'cognova_csrf=csrf; Path=/'
  const fetch = vi.fn(async (url: string, request: RequestInit = {}) => {
    const parsed = new URL(url,'https://test')
    if (url.endsWith('/refresh')) return jsonResponse({ access_token:makeToken(),token_type:'bearer' })
    if (url.endsWith('/me')) return jsonResponse(options.incomplete ? { ...user,onboarding:{ ...user.onboarding,status:'incomplete',next_step:'academic_profile' } } : user)
    if (parsed.pathname.endsWith('/subjects')) return jsonResponse({ items:[subject],next_after_id:null })
    if (parsed.pathname.endsWith('/calendar')) return options.calendar ? options.calendar(parsed,request) : jsonResponse({ items:[calendarItem],next_cursor:null })
    if (parsed.pathname.endsWith('/activities/1')) return jsonResponse({ ...activity,...calendarItem })
    if (parsed.pathname.endsWith('/deadline-history')) return jsonResponse({ items:[],next_after_revision:null })
    throw new Error('Unexpected test endpoint')
  })
  vi.stubGlobal('fetch',fetch)
  const mounted = render(<StrictMode><MemoryRouter initialEntries={[options.path ?? '/app/calendar?date=2030-01-15&view=month']}><AuthProvider><AppRoutes /><Location /></AuthProvider></MemoryRouter></StrictMode>)
  return { fetch,...mounted }
}
