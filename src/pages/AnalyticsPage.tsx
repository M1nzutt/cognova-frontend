import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/ApiError'
import { useAnalyticsService } from '../hooks/useAnalyticsService'
import { analyticsCategories, type AnalyticsCategory, type AnalyticsOverview, type AnalyticsSearchItem, type AnalyticsStudyTime, type AnalyticsTimelineItem } from '../types/analytics'
import { analyticsTimezone, buildAnalyticsRange, initialRangeDates, rangeDatesForPreset, type AnalyticsRangePreset } from '../utils/analyticsTime'
import styles from './AnalyticsPage.module.css'

interface LoadState<T> { loading:boolean; error:string; data:T|null }
const emptyState=<T,>():LoadState<T>=>({loading:true,error:'',data:null})
function errorText(error:unknown,fallback:string):string { return error instanceof ApiError&&error.status!==0?error.message:fallback }
function duration(seconds:string):string {
 const value=Number(seconds); if(!Number.isFinite(value)||value<0)return 'Sin datos'
 const minutes=Math.floor(value/60),hours=Math.floor(minutes/60),rest=minutes%60
 if(hours&&rest)return hours+' h '+rest+' min'
 if(hours)return hours+' h'
 if(minutes)return minutes+' min'
 return Math.round(value)+' s'
}
function localTime(value:string,withDate=true):string {
 const date=new Date(value); if(!Number.isFinite(date.getTime()))return 'Fecha no disponible'
 return new Intl.DateTimeFormat(undefined,withDate?{dateStyle:'medium',timeStyle:'short'}:{month:'short',day:'numeric'}).format(date)
}
function count(value:number):string { return new Intl.NumberFormat().format(value) }
const metrics:[keyof AnalyticsOverview,string,boolean][]=[
 ['total_studied_seconds','Tiempo total estudiado',true],['finished_sessions','Sesiones finalizadas',false],
 ['completed_sessions','Sesiones completadas',false],['partial_sessions','Sesiones parciales',false],
 ['postponed_sessions','Sesiones postergadas',false],['cancelled_sessions','Sesiones canceladas',false],
 ['subjects_with_activity','Materias con actividad',false],['completed_activities','Actividades completadas',false],
 ['pending_activities','Actividades pendientes',false],['in_progress_activities','Actividades en progreso',false],
 ['active_plans','Planes activos',false],['completed_plans','Planes completados',false],
 ['completed_challenges','Retos completados',false],['failed_challenges','Retos fallidos',false],
]
const categories:Record<AnalyticsCategory,string>={activity:'Actividad',study_session:'Sesión de estudio',decision:'Decisión de un plan',plan:'Plan',challenge:'Reto'}
const searchNames={subject:'Materias',activity:'Actividades',study_plan:'Planes',study_challenge:'Retos'}
const statusNames:Record<string,string>={active:'Activo',archived:'Archivada',pending:'Pendiente',in_progress:'En progreso',completed:'Completado',postponed:'Postergado',cancelled:'Cancelado',failed:'Fallido',abandoned:'Abandonado',draft:'Borrador'}
function statusText(value:string):string{return statusNames[value]||'Registrado'}
function eventDescription(item:AnalyticsTimelineItem):string {
 if(item.category==='decision') {
  const action=item.details.action
  if(action==='accepted')return 'Se aceptó una propuesta del plan.'
  if(action==='edited')return 'Se editó una propuesta del plan.'
  if(action==='rejected')return 'Se rechazó una propuesta del plan.'
  if(action==='regenerated')return 'Se generó una nueva propuesta para el plan.'
  return 'Se registró una decisión del plan.'
 }
 const labels:Record<string,string>={created:'Se creó este recurso.',planned:'Sesión planificada.',started:'Se inició una sesión.',finished:'Se cerró una sesión.',deadline:'Fecha límite registrada.',rescheduled:'Se cambió la fecha límite.',postponed:'Se aplazó la fecha límite.'}
 return labels[item.event_type]||'Registro académico.'
}
function eventHref(item:AnalyticsTimelineItem):string|null {
 if(item.resource_type==='activity')return '/app/activities/'+item.resource_id
 if(item.resource_type==='study_session')return '/app/sessions/'+item.resource_id
 if(item.resource_type==='study_plan')return '/app/study-plans/'+item.resource_id
 if(item.resource_type==='study_challenge'&&Number.isSafeInteger(item.details.plan_id))return '/app/study-plans/'+String(item.details.plan_id)+'/challenges/'+item.resource_id
 if(item.resource_type==='subject')return '/app/subjects/'+item.resource_id
 return null
}
function searchHref(item:AnalyticsSearchItem):string|null {
 if(item.type==='subject')return '/app/subjects/'+item.id
 if(item.type==='activity')return '/app/activities/'+item.id
 if(item.type==='study_plan')return '/app/study-plans/'+item.id
 if(item.type==='study_challenge'&&item.plan_id)return '/app/study-plans/'+item.plan_id+'/challenges/'+item.id
 return null
}

export function AnalyticsPage() {
 const service=useAnalyticsService()
 const [preset,setPreset]=useState<AnalyticsRangePreset>('week')
 const [granularity,setGranularity]=useState<'day'|'week'|'month'>('day')
 const [initialDates]=useState(()=>initialRangeDates('week'))
 const [fromDate,setFromDate]=useState(initialDates[0]),[toDate,setToDate]=useState(initialDates[1])
 const timezone=useMemo(analyticsTimezone,[])
 const [category,setCategory]=useState<AnalyticsCategory|'all'>('all')
 const [refresh,setRefresh]=useState(0)
 const [overview,setOverview]=useState<LoadState<AnalyticsOverview>>(emptyState)
 const [study,setStudy]=useState<LoadState<AnalyticsStudyTime>>(emptyState)
 const [timeline,setTimeline]=useState<{items:AnalyticsTimelineItem[];cursor:string|null;loading:boolean;error:string}>({items:[],cursor:null,loading:true,error:''})
 const [timelineMore,setTimelineMore]=useState(false)
 const [query,setQuery]=useState('')
 const [search,setSearch]=useState<{items:AnalyticsSearchItem[];cursor:string|null;loading:boolean;error:string;searched:boolean}>({items:[],cursor:null,loading:false,error:'',searched:false})
 const dates=rangeDatesForPreset(preset,fromDate,toDate)
 const range=buildAnalyticsRange(dates[0],dates[1],timezone)

 useEffect(()=>{
  const controller=new AbortController();setOverview(emptyState())
  service.overview(controller.signal).then(data=>{if(!controller.signal.aborted)setOverview({loading:false,error:'',data})})
   .catch(error=>{if(!controller.signal.aborted)setOverview({loading:false,error:errorText(error,'No pudimos cargar el resumen.'),data:null})})
  return ()=>controller.abort()
 },[service,refresh])
 useEffect(()=>{
  const controller=new AbortController()
  if(range.error){setStudy({loading:false,error:range.error,data:null});setTimeline({items:[],cursor:null,loading:false,error:''});return ()=>controller.abort()}
  setStudy(emptyState())
  service.studyTime({from:range.from,to:range.to,timezone,granularity},controller.signal)
   .then(data=>{if(!controller.signal.aborted)setStudy({loading:false,error:'',data})})
   .catch(error=>{if(!controller.signal.aborted)setStudy({loading:false,error:errorText(error,'No pudimos cargar el tiempo estudiado.'),data:null})})
  setTimeline({items:[],cursor:null,loading:true,error:''})
  service.timeline({from:range.from,to:range.to,...(category==='all'?{}:{category})},controller.signal)
   .then(page=>{if(!controller.signal.aborted)setTimeline({items:page.items,cursor:page.next_cursor,loading:false,error:''})})
   .catch(error=>{if(!controller.signal.aborted)setTimeline({items:[],cursor:null,loading:false,error:errorText(error,'No pudimos cargar la cronología.')})})
  return ()=>controller.abort()
 },[service,range.from,range.to,range.error,timezone,granularity,category,refresh])
 useEffect(()=>{
  const term=query.trim()
  if(!term){setSearch({items:[],cursor:null,loading:false,error:'',searched:false});return}
  const controller=new AbortController()
  const timer=window.setTimeout(()=>{
   setSearch({items:[],cursor:null,loading:true,error:'',searched:true})
   service.search(term,controller.signal).then(page=>{if(!controller.signal.aborted)setSearch({items:page.items,cursor:page.next_cursor,loading:false,error:'',searched:true})})
    .catch(error=>{if(!controller.signal.aborted)setSearch({items:[],cursor:null,loading:false,error:errorText(error,'No pudimos buscar recursos.'),searched:true})})
  },300)
  return ()=>{window.clearTimeout(timer);controller.abort()}
 },[query,service])
 const loadMoreTimeline=useCallback(async()=>{
  if(!timeline.cursor||timelineMore||range.error)return
  setTimelineMore(true)
  try{const page=await service.timeline({from:range.from,to:range.to,...(category==='all'?{}:{category}),cursor:timeline.cursor});setTimeline(current=>({...current,items:[...current.items,...page.items],cursor:page.next_cursor}))}
  catch(error){setTimeline(current=>({...current,error:errorText(error,'No pudimos cargar más eventos.')}))}
  finally{setTimelineMore(false)}
 },[service,timeline.cursor,timelineMore,range,category])
 const loadMoreSearch=useCallback(async()=>{
  if(!search.cursor||search.loading)return
  setSearch(current=>({...current,loading:true,error:''}))
  try{const page=await service.search(query.trim(),undefined,search.cursor);setSearch(current=>({...current,items:[...current.items,...page.items],cursor:page.next_cursor,loading:false}))}
  catch(error){setSearch(current=>({...current,loading:false,error:errorText(error,'No pudimos cargar más resultados.')}))}
 },[service,search.cursor,search.loading,query])
 const maxSubject=Math.max(1,...(study.data?.by_subject.map(x=>Number(x.seconds))||[]))
 const maxBucket=Math.max(1,...(study.data?.buckets.map(x=>Number(x.seconds))||[]))
 const groups=useMemo(()=>search.items.reduce<Record<string,AnalyticsSearchItem[]>>((all,item)=>{const name=searchNames[item.type];(all[name]??=[]).push(item);return all},{}),[search.items])

 return <section className={styles.page}>
  <header className={styles.heading}><div><p className="eyebrow">TU RECORRIDO ACADÉMICO</p><h1>Análisis</h1><p>Consulta lo que has registrado y observa cómo se distribuye tu tiempo de estudio.</p></div><button className="button" onClick={()=>setRefresh(n=>n+1)}>Actualizar</button></header>
  <section className={styles.section} aria-labelledby="overview-title"><h2 id="overview-title">Resumen general</h2>
   {overview.loading&&<p role="status">Cargando resumen…</p>}
   {overview.error&&<div role="alert"><p>{overview.error}</p><button className="button" onClick={()=>setRefresh(n=>n+1)}>Intentar de nuevo</button></div>}
   {overview.data&&<dl className={styles.metrics}>{metrics.map(([key,label,isDuration])=><div className={styles.metric} key={key}><dt>{label}</dt><dd>{isDuration?duration(overview.data!.total_studied_seconds):count(overview.data![key] as number)}</dd></div>)}</dl>}
  </section>
  <section className={styles.section} aria-labelledby="study-title"><div className={styles.sectionHeading}><div><h2 id="study-title">Tiempo de estudio</h2><p>Zona horaria local: {timezone}.</p></div><label>Periodo<select value={preset} onChange={e=>setPreset(e.target.value as AnalyticsRangePreset)}><option value="day">Día</option><option value="week">Semana</option><option value="month">Mes</option><option value="custom">Rango personalizado</option></select></label></div>
   {preset==='custom'&&<div className={styles.rangeFields}><label>Desde (incluido)<input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></label><label>Hasta (exclusivo)<input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></label></div>}
   {range.error&&<p className={styles.notice} role="alert">{range.error}</p>}
   <label className={styles.granularity}>Agrupar por<select value={granularity} onChange={e=>setGranularity(e.target.value as typeof granularity)}><option value="day">Día</option><option value="week">Semana</option><option value="month">Mes</option></select></label>
   {study.loading&&<p role="status">Cargando tiempo de estudio…</p>}
   {study.error&&!range.error&&<div role="alert"><p>{study.error}</p><button className="button" onClick={()=>setRefresh(n=>n+1)}>Intentar de nuevo</button></div>}
   {study.data&&<div><p><strong>{duration(study.data.total_seconds)}</strong> en {count(study.data.sessions_count)} sesiones.</p><div className={styles.charts}>
    <section aria-labelledby="bucket-title"><h3 id="bucket-title">Tiempo a lo largo del periodo</h3>{study.data.buckets.length===0?<p>No hay intervalos en este periodo.</p>:<ol className={styles.chartList}>{study.data.buckets.map((bucket,i)=><li key={bucket.from+'-'+i}><span>{localTime(bucket.from,false)}</span><progress aria-label={localTime(bucket.from,false)+': '+duration(bucket.seconds)} max={maxBucket} value={Number(bucket.seconds)}/><strong>{duration(bucket.seconds)}</strong></li>)}</ol>}</section>
    <section aria-labelledby="subject-title"><h3 id="subject-title">Distribución por materia</h3>{study.data.by_subject.length===0?<p>No hay materias con tiempo registrado en este periodo.</p>:<ol className={styles.chartList}>{study.data.by_subject.map(subject=><li key={subject.subject_id}><span>{subject.name}</span><progress aria-label={subject.name+': '+duration(subject.seconds)} max={maxSubject} value={Number(subject.seconds)}/><strong>{duration(subject.seconds)}</strong></li>)}</ol>}</section>
   </div></div>}
  </section>
  <section className={styles.section} aria-labelledby="timeline-title"><div className={styles.sectionHeading}><div><h2 id="timeline-title">Cronología académica</h2><p>Eventos presentados en el orden del servicio.</p></div><label>Tipo de evento<select value={category} onChange={e=>setCategory(e.target.value as AnalyticsCategory|'all')}><option value="all">Todos</option>{analyticsCategories.map(x=><option key={x} value={x}>{categories[x]}</option>)}</select></label></div>
   {timeline.loading&&<p role="status">Cargando cronología…</p>}
   {timeline.error&&<div role="alert"><p>{timeline.error}</p><button className="button" onClick={()=>setRefresh(n=>n+1)}>Intentar de nuevo</button></div>}
   {!range.error&&!timeline.loading&&!timeline.error&&timeline.items.length===0&&<p>No hay eventos para este periodo.</p>}
   {timeline.items.length>0&&<ol className={styles.timeline} aria-label="Cronología académica">{timeline.items.map(item=>{const href=eventHref(item);return <li key={item.event_id}><time dateTime={item.occurred_at}>{localTime(item.occurred_at)}</time><span className={styles.kind}>{categories[item.category]}</span>{href?<Link to={href}>{item.title}</Link>:<strong>{item.title}</strong>}<p>{eventDescription(item)}{item.subject_name?' Materia: '+item.subject_name+'.':''}</p></li>})}</ol>}
   {timeline.cursor&&<button className="button" disabled={timelineMore} onClick={()=>void loadMoreTimeline()}>{timelineMore?'Cargando…':'Ver más eventos'}</button>}
  </section>
  <section className={styles.section} aria-labelledby="search-title"><h2 id="search-title">Buscar en tu espacio académico</h2><label className={styles.searchField}>Buscar por nombre<input type="search" maxLength={64} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Materia, actividad, plan o reto"/></label>
   {search.loading&&<p role="status">Buscando…</p>}{search.error&&<p role="alert">{search.error}</p>}
   {search.searched&&!search.loading&&!search.error&&!search.items.length&&<p>No encontramos recursos con ese prefijo.</p>}
   <div className={styles.searchGroups}>{Object.entries(groups).map(([name,items])=><section key={name} aria-label={name}><h3>{name}</h3><ul>{items.map(item=>{const href=searchHref(item);return <li key={item.type+'-'+item.id}>{href?<Link to={href}>{item.title}</Link>:<span>{item.title}</span>}{item.status&&<small>Estado: {statusText(item.status)}</small>}</li>})}</ul></section>)}</div>
   {search.cursor&&<button className="button" disabled={search.loading} onClick={()=>void loadMoreSearch()}>{search.loading?'Cargando…':'Ver más resultados'}</button>}
  </section>
 </section>
}
