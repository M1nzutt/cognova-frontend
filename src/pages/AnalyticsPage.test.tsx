import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnalyticsCategory, AnalyticsOverview, AnalyticsStudyTime, AnalyticsTimelinePage } from '../types/analytics'
import { AnalyticsPage } from './AnalyticsPage'

const mocks=vi.hoisted(()=>({overview:vi.fn(),studyTime:vi.fn(),timeline:vi.fn(),search:vi.fn(),listConversations:vi.fn(),createConversation:vi.fn(),messages:vi.fn(),send:vi.fn()}))
vi.mock('../hooks/useAnalyticsService',()=>({useAnalyticsService:()=>mocks}))
vi.mock('../hooks/useAcademicChatService',()=>({useAcademicChatService:()=>mocks}))
const overview:AnalyticsOverview={total_studied_seconds:'10800.000000',total_studied_minutes:'180.000000',cancelled_session_seconds:'0.000000',cancelled_session_minutes:'0.000000',finished_sessions:3,completed_sessions:2,partial_sessions:1,postponed_sessions:0,cancelled_sessions:0,subjects_with_activity:2,completed_activities:4,pending_activities:2,in_progress_activities:1,active_plans:1,completed_plans:1,completed_challenges:2,failed_challenges:1}
const study:AnalyticsStudyTime={from:'2030-04-15T00:00:00Z',to:'2030-04-22T00:00:00Z',timezone:'UTC',granularity:'day',total_seconds:'10800.000000',total_minutes:'180.000000',cancelled_seconds:'0.000000',cancelled_minutes:'0.000000',cancelled_sessions_count:0,sessions_count:3,by_subject:[{subject_id:4,name:'Física',seconds:'7200.000000',minutes:'120.000000',sessions_count:2}],buckets:[{from:'2030-04-15T00:00:00Z',to:'2030-04-16T00:00:00Z',seconds:'3600.000000',minutes:'60.000000'}]}
const event=(id:string,category:AnalyticsCategory,title:string)=>({
 event_id:id,occurred_at:'2030-04-15T10:00:00Z',category,event_type:category==='decision'?'decision':'created',
 resource_type:category==='decision'||category==='plan'?'study_plan':category==='challenge'?'study_challenge':category,
 resource_id:Number(id),title,subject_id:4,subject_name:'Física',
 details:category==='decision'?{action:'accepted'}:category==='challenge'?{plan_id:10}:{},
})
const timeline:AnalyticsTimelinePage={items:[event('1','activity','Entrega de ensayo'),event('2','study_session','Sesión de estudio')],next_cursor:'next'}
function mount(initial='/app/analytics'){return render(<MemoryRouter initialEntries={[initial]}><AnalyticsPage/></MemoryRouter>)}

describe('AnalyticsPage',()=>{
 beforeEach(()=>{
  vi.resetAllMocks()
  mocks.overview.mockResolvedValue(overview);mocks.studyTime.mockResolvedValue(study)
  mocks.timeline.mockResolvedValue(timeline);mocks.search.mockResolvedValue({items:[],next_cursor:null})
  mocks.listConversations.mockResolvedValue([])
  mocks.createConversation.mockResolvedValue({id:12,title:'Nueva conversación',created_at:'2030-04-15T10:00:00Z',updated_at:'2030-04-15T10:00:00Z'})
  mocks.messages.mockResolvedValue({items:[],next_before_id:null})
  mocks.send.mockResolvedValue({conversation:{id:12,title:'Chat contextual',created_at:'2030-04-15T10:00:00Z',updated_at:'2030-04-15T10:01:00Z'},user_message:{id:3,role:'user',content:'¿Cómo priorizo?',evidence:[],created_at:'2030-04-15T10:00:30Z'},assistant_message:{id:4,role:'assistant',content:'Podemos revisar tus pendientes.',evidence:['Actividad pendiente'],created_at:'2030-04-15T10:01:00Z'}})
  vi.stubGlobal('matchMedia',vi.fn().mockReturnValue({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
 })
 it('shows descriptive overview, charts and mixed events without causal claims',async()=>{
  mount()
  expect(await screen.findByRole('heading',{name:'Análisis'})).toBeVisible()
  const searchHeading=screen.getByRole('heading',{name:'Buscar en tu espacio académico'})
  const overviewHeading=screen.getByRole('heading',{name:'Resumen general'})
  expect(searchHeading.compareDocumentPosition(overviewHeading)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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
  it('labels cancelled timer duration separately from studied time',async()=>{
   mocks.studyTime.mockResolvedValue({...study,cancelled_seconds:'45662.422572',cancelled_minutes:'761.040376',cancelled_sessions_count:1})
   mount()
   expect(await screen.findByRole('note')).toHaveTextContent('12 h 41 min')
   expect(screen.getByText(/excluido del tiempo estudiado/)).toBeVisible()
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
  mocks.overview.mockResolvedValue({...overview,total_studied_seconds:'0.000000',total_studied_minutes:'0.000000',cancelled_session_seconds:'0.000000',cancelled_session_minutes:'0.000000',finished_sessions:0,completed_sessions:0,partial_sessions:0,postponed_sessions:0,cancelled_sessions:0,subjects_with_activity:0,completed_activities:0,pending_activities:0,in_progress_activities:0,active_plans:0,completed_plans:0,completed_challenges:0,failed_challenges:0})
  mount()
   expect(await screen.findAllByText('0 s')).toHaveLength(2)
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
  it('opens, expands, hides and reopens the reusable chat with simulated history and messages',async()=>{
   const user=userEvent.setup()
   const conversation={id:7,title:'Historial guardado',created_at:'2030-04-14T10:00:00Z',updated_at:'2030-04-15T10:00:00Z'}
   mocks.listConversations.mockResolvedValue([conversation])
   mocks.messages.mockResolvedValueOnce({items:[{id:9,role:'assistant',content:'Respuesta anterior guardada.',evidence:['Sesión 3'],created_at:'2030-04-15T10:00:00Z'}],next_before_id:5})
    .mockResolvedValueOnce({items:[{id:5,role:'user',content:'Mensaje anterior.',evidence:[],created_at:'2030-04-14T10:00:00Z'}],next_before_id:null})
   mount()
   const open=await screen.findByRole('button',{name:'Abrir IA Cognova'})
   await user.click(open)
   expect(await screen.findByRole('heading',{name:/IA Cognova/})).toBeVisible()
   expect(await screen.findByRole('button',{name:/Historial guardado/})).toBeVisible()
   await user.click(screen.getByRole('button',{name:/Historial guardado/}))
   expect(await screen.findByText('Respuesta anterior guardada.')).toBeVisible()
   await user.click(screen.getByRole('button',{name:'Ver mensajes anteriores'}))
   expect(await screen.findByText('Mensaje anterior.')).toBeVisible()
   const composer=screen.getByLabelText('Escribe tu consulta académica')
   await user.type(composer,'¿Cómo priorizo?')
   await user.click(screen.getByRole('button',{name:'Enviar mensaje'}))
   expect(await screen.findByText('Podemos revisar tus pendientes.')).toBeVisible()
   expect(mocks.send).toHaveBeenCalledWith(7,'¿Cómo priorizo?')
   await user.click(screen.getByRole('button',{name:'Nueva conversación'}))
   expect(mocks.createConversation).toHaveBeenCalledOnce()
   expect(await screen.findByRole('heading',{name:'Nueva conversación'})).toBeVisible()
   await user.click(screen.getByRole('button',{name:'Expandir panel de IA Cognova'}))
   expect(screen.getByRole('button',{name:'Reducir panel de IA Cognova'})).toHaveAttribute('aria-pressed','true')
   await user.click(screen.getByRole('button',{name:'Volver a las estadísticas'}))
   expect(screen.queryByRole('heading',{name:/IA Cognova/})).not.toBeInTheDocument()
   expect(screen.getByRole('heading',{name:'Análisis'})).toBeVisible()
   await user.click(screen.getByRole('button',{name:'Abrir IA Cognova'}))
   expect(await screen.findByRole('heading',{name:'Nueva conversación'})).toBeVisible()
   expect(mocks.listConversations).toHaveBeenCalledTimes(2)
  })
  it('presents an accessible full-screen chat dialog on mobile and returns focus to Analytics',async()=>{
   vi.stubGlobal('matchMedia',vi.fn().mockReturnValue({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
   const user=userEvent.setup()
   mount()
   const open=await screen.findByRole('button',{name:'Abrir IA Cognova'})
   await user.click(open)
   const dialog=await screen.findByRole('dialog',{name:/IA Cognova/})
   expect(dialog).toHaveAttribute('aria-modal','true')
   expect(screen.getByRole('button',{name:'Volver a las estadísticas'})).toHaveFocus()
   await user.keyboard('{Escape}')
   expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
   expect(screen.getByRole('heading',{name:'Análisis'})).toBeVisible()
   await waitFor(()=>expect(open).toHaveFocus())
  })
  it('opens the assistant when returning from its former standalone route',async()=>{
   mount('/app/analytics?assistant=open')
   expect(await screen.findByRole('heading',{name:/IA Cognova/})).toBeVisible()
   expect(screen.getByRole('heading',{name:'Análisis'})).toBeVisible()
   expect(screen.getByRole('button',{name:'Volver a las estadísticas'})).toBeVisible()
  })
 })
