import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { ActivitySmokeApi } from './ActivitySmokeApi.ts'
import { check, production } from './SubjectSmokeApi.ts'
import type { Activity, ActivityList } from '../src/types/activity.ts'
check(process.env.SMOKE_ALLOW_PRODUCTION_WRITE === '1', 'Explicit production write opt-in required')
const browser = await chromium.launch({ channel:'chrome',headless:true })
const context = await browser.newContext({ viewport:{ width:1440,height:1000 },timezoneId:'America/Bogota',colorScheme:'light' })
const page = await context.newPage(), api = new ActivitySmokeApi(context)
page.setDefaultTimeout(25000)
const checks:string[] = [], responses:{ path:string;method:string;status:number;noStore:boolean }[] = [], tasks:Promise<void>[] = []
let stage='public auth',passed=false,cleaned=false,pageErrors=0,cspWarnings=0,beforeHash='',afterHash=''
const ids:number[] = [], subjectIds:number[] = []
page.on('pageerror',()=>pageErrors++)
page.on('console',message=>{ if (message.text().includes('Content Security Policy')) cspWarnings++ })
page.on('response',response=>{
  if (!response.url().includes('/api/v1/')) return
  tasks.push((async()=>{ const headers=await response.allHeaders();responses.push({ path:new URL(response.url()).pathname,method:response.request().method(),status:response.status(),noStore:!!headers['cache-control']?.includes('no-store') }) })())
})
const itemLink=()=>page.getByRole('link',{ name:/Ensayo calendario/ })
async function viewReady(view:'mensual'|'semanal') { await expect(page.getByRole('region',{ name:'Vista '+view,exact:true })).toBeVisible() }
async function screenshot(name:string) {
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow')
  await page.screenshot({ path:'.local/calendar-'+name+'.png',fullPage:true })
}
try {
  await mkdir('.local',{ recursive:true })
  await page.goto(production+'/app/calendar?date=2030-01-15&view=month');await expect(page).toHaveURL(/\/login$/);checks.push('anonymous direct route protected')
  stage='synthetic setup';await api.bootstrap()
  const subject=await api.create('Calendario smoke'),second=await api.create('Otra calendario','archived');subjectIds.push(subject.id,second.id)
  const fixtures=[
    { title:'Ensayo calendario',subject_id:subject.id,deadline:'2030-01-15T15:00:00Z',priority:'high',status:'pending' },
    { title:'Revisión calendario',subject_id:second.id,deadline:'2030-01-16T01:30:00Z',priority:'urgent',status:'in_progress' },
    { title:'Entrega febrero',subject_id:subject.id,deadline:'2030-02-01T15:00:00Z',priority:'low',status:'completed' },
  ]
  for (const fixture of fixtures) { const item=await api.request<Activity>('create_calendar_fixture','activities',201,'POST',{ ...fixture,estimated_duration:30,notes:'Synthetic calendar browser validation' });ids.push(item.id) }
  const before=await api.request<ActivityList>('snapshot_before','activities?limit=100',200)
  beforeHash=createHash('sha256').update(JSON.stringify(before)).digest('hex')
  stage='monthly';await page.goto(production+'/app/calendar?date=2030-01-15&view=month');await viewReady('mensual')
  await expect(itemLink()).toBeVisible()
  const jan15=page.getByRole('region',{ name:'martes, 15 de enero de 2030',exact:true })
  await expect(jan15.getByRole('link',{ name:/Ensayo calendario/ })).toContainText('10:00')
  await expect(jan15.getByRole('link',{ name:/Revisión calendario/ })).toContainText('20:30')
  checks.push('monthly; deadlines grouped in America/Bogota including UTC day boundary')
  stage='weekly';await page.getByRole('button',{ name:'Semana',exact:true }).click();await viewReady('semanal');await expect(itemLink()).toBeVisible();checks.push('weekly')
  stage='filters';await page.getByLabel('Filtrar por materia').selectOption(String(subject.id));await viewReady('semanal')
  await page.getByLabel('Filtrar por estado').selectOption('pending');await viewReady('semanal')
  await page.getByLabel('Filtrar por prioridad').selectOption('high');await viewReady('semanal');await expect(itemLink()).toBeVisible()
  await expect(page.getByRole('link',{ name:/Revisión calendario/ })).toHaveCount(0)
  await page.getByLabel('Filtrar por prioridad').selectOption('urgent');await expect(page.getByText('No hay actividades con estos filtros')).toBeVisible()
  await page.getByRole('button',{ name:'Limpiar filtros' }).click();await expect(itemLink()).toBeVisible();checks.push('subject/status/priority AND filters; empty; clear')
  stage='navigation';await page.getByRole('button',{ name:'Mes',exact:true }).click();await viewReady('mensual')
  await page.getByRole('button',{ name:'Periodo siguiente' }).click();await expect(page.getByRole('heading',{ name:'febrero de 2030' })).toBeVisible();await viewReady('mensual')
  await page.getByLabel('Ir a fecha').fill('2030-12-31');await viewReady('mensual')
  await page.getByRole('button',{ name:'Periodo siguiente' }).click();await expect(page.getByRole('heading',{ name:'enero de 2031' })).toBeVisible();await viewReady('mensual')
  await page.getByRole('button',{ name:'Hoy',exact:true }).click();await viewReady('mensual')
  const today=await page.evaluate(()=>{ const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') })
  await expect(page.getByLabel('Ir a fecha')).toHaveValue(today);checks.push('next period; month/year boundary; today')
  stage='keyboard/detail';await page.getByLabel('Ir a fecha').fill('2030-01-15');await viewReady('mensual')
  const week=page.getByRole('button',{ name:'Semana',exact:true });await week.focus();await page.keyboard.press('Enter');await viewReady('semanal');await expect(week).toBeFocused()
  await itemLink().focus();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{ name:'Ensayo calendario',exact:true })).toBeVisible()
  await expect(page.getByRole('button',{ name:'Editar actividad',exact:true })).toBeVisible()
  await expect(page.getByText('Fecha original',{ exact:true })).toBeVisible();checks.push('keyboard controls; activity link to original detail/edit flow')
  stage='refresh/direct';await page.goto(production+'/app/calendar?date=2030-01-15&view=week&priority=high');await viewReady('semanal');await expect(itemLink()).toBeVisible()
  await page.reload();await viewReady('semanal');await expect(page.getByLabel('Filtrar por prioridad')).toHaveValue('high');await expect(itemLink()).toBeVisible();checks.push('direct route; refresh restores session/date/view/filter')
  stage='visual';await page.getByRole('button',{ name:'Limpiar filtros' }).click();await viewReady('semanal')
  for (const width of [1440,375]) {
    await page.setViewportSize({ width,height:width===375?812:1000 })
    for (const view of ['Mes','Semana']) {
      await page.getByRole('button',{ name:view,exact:true }).click();await viewReady(view==='Mes'?'mensual':'semanal')
      for (const dark of [false,true]) {
        const toggle=page.getByRole('button',{ name:/Modo oscuro/ })
        if ((await toggle.getAttribute('aria-pressed')==='true')!==dark) await toggle.click()
        await screenshot(width+'-'+view.toLowerCase()+'-'+(dark?'dark':'light'))
      }
    }
  }
  checks.push('1440/375 month/week light/dark; no horizontal overflow')
  stage='read-only/security'
  const after=await api.request<ActivityList>('snapshot_after','activities?limit=100',200)
  afterHash=createHash('sha256').update(JSON.stringify(after)).digest('hex');check(beforeHash===afterHash,'calendar did not change activities')
  const storage=await page.evaluate(()=>({ local:Object.keys(localStorage),session:Object.keys(sessionStorage) }))
  check(storage.local.every(k=>k==='cognova.theme')&&!storage.session.length,'no academic/auth storage')
  await Promise.all(tasks);check(responses.filter(r=>r.path.endsWith('/calendar')).every(r=>r.method==='GET'&&r.status===200),'calendar GET only')
  check(responses.every(r=>r.noStore),'all API responses no-store');check(pageErrors===0,'no unhandled JS errors')
  checks.push('read-only activity snapshot equality; no-store; no auth/academic storage; zero unhandled JS errors')
  stage='cleanup';await api.cleanup();cleaned=true
  for (const id of ids) await api.request('revoked_session','activities/'+id,401)
  await page.reload();await expect(page).toHaveURL(/\/login$/);checks.push('synthetic activities/subjects deleted; session revoked; protected route after logout')
  passed=true
} catch {
  await page.screenshot({ path:'.local/calendar-failure.png',fullPage:true }).catch(()=>undefined)
  console.error('Calendar smoke stopped at '+stage+'; API operation '+api.operation);process.exitCode=1
} finally {
  if (!cleaned&&api.userId) { try { await api.cleanup();cleaned=true } catch { console.error('Synthetic cleanup requires follow-up');process.exitCode=1 } }
  await Promise.allSettled(tasks)
  const evidence={ date:new Date().toISOString(),passed,stage,userId:api.userId,activityIds:ids,subjectIds,cleaned,pageErrors,cspWarnings,beforeHash,afterHash,checks,responses,api:api.evidence }
  await writeFile('.local/calendar-browser-smoke.json',JSON.stringify(evidence,null,2))
  console.log(JSON.stringify({ passed,stage,userId:api.userId,cleaned,pageErrors,cspWarnings,checks }))
  await browser.close()
}
