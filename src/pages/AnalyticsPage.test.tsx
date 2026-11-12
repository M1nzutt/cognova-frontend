import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnalyticsCategory, AnalyticsOverview, AnalyticsStudyTime, AnalyticsTimelinePage } from '../types/analytics'
import { AnalyticsPage } from './AnalyticsPage'

const mocks=vi.hoisted(()=>({overview:vi.fn(),studyTime:vi.fn(),timeline:vi.fn(),search:vi.fn()}))
vi.mock('../hooks/useAnalyticsService',()=>({useAnalyticsService:()=>mocks}))
const overview:AnalyticsOverview={total_studied_seconds:'10800.000000',total_studied_minutes:'180.000000',finished_sessions:3,completed_sessions:2,partial_sessions:1,postponed_sessions:0,cancelled_sessions:0,subjects_with_activity:2,completed_activities:4,pending_activities:2,in_progress_activities:1,active_plans:1,completed_plans:1,completed_challenges:2,failed_challenges:1}
const study:AnalyticsStudyTime={from:'2030-04-15T00:00:00Z',to:'2030-04-22T00:00:00Z',timezone:'UTC',granularity:'day',total_seconds:'10800.000000',total_minutes:'180.000000',sessions_count:3,by_subject:[{subject_id:4,name:'Física',seconds:'7200.000000',minutes:'120.000000',sessions_count:2}],buckets:[{from:'2030-04-15T00:00:00Z',to:'2030-04-16T00:00:00Z',seconds:'3600.000000',minutes:'60.000000'}]}
const event=(id:string,category:AnalyticsCategory,title:string)=>({
 event_id:id,occurred_at:'2030-04-15T10:00:00Z',category,event_type:category==='decision'?'decision':'created',
 resource_type:category==='decision'||category==='plan'?'study_plan':category==='challenge'?'study_challenge':category,
 resource_id:Number(id),title,subject_id:4,subject_name:'Física',
 details:category==='decision'?{action:'accepted'}:category==='challenge'?{plan_id:10}:{},
})
const timeline:AnalyticsTimelinePage={items:[event('1','activity','Entrega de ensayo'),event('2','study_session','Sesión de estudio')],next_cursor:'next'}
function mount(){return render(<MemoryRouter><AnalyticsPage/></MemoryRouter>)}

describe('AnalyticsPage',()=>{
 beforeEach(()=>{
  vi.resetAllMocks()
  mocks.overview.mockResolvedValue(overview);mocks.studyTime.mockResolvedValue(study)
  mocks.timeline.mockResolvedValue(timeline);mocks.search.mockResolvedValue({items:[],next_cursor:null})
 })
 it('shows descriptive overview, charts and mixed events without causal claims',async()=>{
  mount()
  expect(await screen.findByRole('heading',{name:'Análisis'})).toBeVisible()
  expect(await screen.findAllByText('3 h')).toHaveLength(2)
  expect(screen.getByText('Actividades pendientes')).toBeVisible()
  expect(await screen.findByLabelText(/Física: 2 h/)).toBeInTheDocument()
  expect(await screen.findByRole('link',{name:'Entrega de ensayo'})).toBeVisible()
  expect(screen.getByRole('link',{name:'Sesión de estudio'})).toHaveAttribute('href','/app/sessions/2')
  expect(screen.queryByText(/porque/i)).not.toBeInTheDocument()
 })
 it('sends the browser timezone and date range, and applies category filters',async()=>{
  mount()
  await waitFor(()=>expect(mocks.studyTime).toHaveBeenCalled())
  const query=mocks.studyTime.mock.calls[0][0]
  expect(query.timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC')
  expect(query.from).toMatch(/Z$/);expect(query.to).toMatch(/Z$/)
  fireEvent.change(screen.getByLabelText('Tipo de evento'),{target:{value:'activity'}})
  await waitFor(()=>expect(mocks.timeline).toHaveBeenCalledWith(expect.objectContaining({category:'activity'}),expect.any(AbortSignal)))
 })
 it('preserves backend order and passes the timeline cursor',async()=>{
  mocks.timeline.mockResolvedValueOnce(timeline).mockResolvedValueOnce({items:[event('3','activity','Siguiente evento')],next_cursor:null})
  mount()
  const first=await screen.findByRole('link',{name:'Entrega de ensayo'})
  const second=screen.getByRole('link',{name:'Sesión de estudio'})
  expect(first.compareDocumentPosition(second)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  fireEvent.click(await screen.findByRole('button',{name:'Ver más eventos'}))
  expect(await screen.findByRole('link',{name:'Siguiente evento'})).toBeVisible()
  expect(mocks.timeline.mock.calls[1][0].cursor).toBe('next')
 })
 it('renders decisions, plans and challenges from the timeline contract',async()=>{
  mocks.timeline.mockResolvedValueOnce({items:[
   event('1','activity','Entrega'),event('2','study_session','Sesión'),event('3','decision','Plan con decisión'),
   event('4','plan','Plan creado'),event('5','challenge','Reto de Álgebra'),
  ],next_cursor:null})
  mount()
  expect(await screen.findByText(/Se aceptó una propuesta del plan/)).toBeVisible()
  expect(screen.getByRole('link',{name:'Plan con decisión'})).toHaveAttribute('href','/app/study-plans/3')
  expect(screen.getByRole('link',{name:'Plan creado'})).toHaveAttribute('href','/app/study-plans/4')
  expect(screen.getByRole('link',{name:'Reto de Álgebra'})).toHaveAttribute('href','/app/study-plans/10/challenges/5')
 })
 it('debounces search, groups all resource types and follows the prefix cursor',async()=>{
  vi.useFakeTimers()
  mocks.search.mockResolvedValueOnce({items:[
   {type:'subject',id:4,title:'Física',subject_id:null,plan_id:null,status:'active'},
   {type:'activity',id:8,title:'Física I',subject_id:4,plan_id:null,status:'pending'},
   {type:'study_plan',id:12,title:'Plan de Física',subject_id:null,plan_id:null,status:'active'},
  ],next_cursor:'search-cursor'}).mockResolvedValueOnce({items:[
   {type:'study_challenge',id:9,title:'Reto de Física',subject_id:4,plan_id:12,status:'pending'},
  ],next_cursor:null})
  mount()
  fireEvent.change(screen.getByRole('searchbox',{name:'Buscar por nombre'}),{target:{value:'Fisica'}})
  expect(mocks.search).not.toHaveBeenCalled()
  await act(async()=>{vi.advanceTimersByTime(299)})
  expect(mocks.search).not.toHaveBeenCalled()
  await act(async()=>{await vi.advanceTimersByTimeAsync(1)})
  expect(screen.getByRole('link',{name:'Física'})).toHaveAttribute('href','/app/subjects/4')
  expect(screen.getByRole('link',{name:'Física I'})).toHaveAttribute('href','/app/activities/8')
  expect(screen.getByRole('link',{name:'Plan de Física'})).toHaveAttribute('href','/app/study-plans/12')
  expect(screen.getByText('Estado: Pendiente')).toBeVisible()
  fireEvent.click(screen.getByRole('button',{name:'Ver más resultados'}))
  await act(async()=>{await Promise.resolve();await Promise.resolve()})
  expect(screen.getByRole('link',{name:'Reto de Física'})).toHaveAttribute('href','/app/study-plans/12/challenges/9')
  expect(mocks.search).toHaveBeenNthCalledWith(2,'Fisica',undefined,'search-cursor')
 })
 it('does not search an empty query and displays an empty-account overview',async()=>{
  mocks.overview.mockResolvedValue({...overview,total_studied_seconds:'0.000000',total_studied_minutes:'0.000000',finished_sessions:0,completed_sessions:0,partial_sessions:0,postponed_sessions:0,cancelled_sessions:0,subjects_with_activity:0,completed_activities:0,pending_activities:0,in_progress_activities:0,active_plans:0,completed_plans:0,completed_challenges:0,failed_challenges:0})
  mount()
  expect(await screen.findByText('0 s')).toBeVisible()
  expect(mocks.search).not.toHaveBeenCalled()
 })
 it('shows service errors and blocks a custom range over 366 days',async()=>{
  mocks.overview.mockRejectedValue(new Error('private'));mocks.studyTime.mockRejectedValue(new Error('private'))
  mount()
  expect(await screen.findByText('No pudimos cargar el resumen.')).toBeVisible()
  fireEvent.change(screen.getByLabelText('Periodo'),{target:{value:'custom'}})
  fireEvent.change(screen.getByLabelText('Desde (incluido)'),{target:{value:'2030-01-01'}})
  fireEvent.change(screen.getByLabelText('Hasta (exclusivo)'),{target:{value:'2031-02-02'}})
  expect(screen.getByText('El rango máximo es de 366 días.')).toBeVisible()
 })
 it('keeps keyboard controls reachable and Analytics content present at phone, tablet and desktop widths',async()=>{
  const user=userEvent.setup(),view=mount(),refreshButton=await screen.findByRole('button',{name:'Actualizar'})
  await user.tab()
  expect(document.activeElement).toBe(refreshButton)
  expect(screen.getByLabelText('Agrupar por')).toBeInTheDocument()
  view.unmount()
  for(const width of [390,768,1280]){
   Object.defineProperty(window,'innerWidth',{configurable:true,value:width})
   const responsive=mount()
   expect(screen.getByRole('heading',{name:'Tiempo de estudio'})).toBeInTheDocument()
   expect(screen.getByRole('searchbox',{name:'Buscar por nombre'})).toBeInTheDocument()
   responsive.unmount()
  }
 })
})
