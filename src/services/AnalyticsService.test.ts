import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from '../api/client'
import { jsonResponse } from '../test/authFixtures'
import { AnalyticsService } from './AnalyticsService'

const overview={total_studied_seconds:'3600.000000',total_studied_minutes:'60.000000',finished_sessions:1,completed_sessions:1,partial_sessions:0,postponed_sessions:0,cancelled_sessions:0,subjects_with_activity:1,completed_activities:2,pending_activities:3,in_progress_activities:1,active_plans:1,completed_plans:0,completed_challenges:2,failed_challenges:0}
const service=()=>new AnalyticsService(new ApiClient('/api/v1',()=> 'memory',vi.fn()))
describe('AnalyticsService',()=>{
 it('requests overview through the authenticated no-store client and validates metrics',async()=>{
  const fetch=vi.fn().mockResolvedValue(jsonResponse(overview));vi.stubGlobal('fetch',fetch)
  expect(await service().overview()).toEqual(overview)
  const [,options]=fetch.mock.calls[0]
  expect(fetch.mock.calls[0][0]).toBe('/api/v1/analytics/overview')
  expect(options).toMatchObject({method:'GET',cache:'no-store',credentials:'include'})
  expect(options.headers.get('Authorization')).toBe('Bearer memory')
 })
 it('sends range, granularity and explicit IANA timezone',async()=>{
  const result={from:'2030-01-01T05:00:00Z',to:'2030-01-08T05:00:00Z',timezone:'America/Bogota',granularity:'day',total_seconds:'60.000000',total_minutes:'1.000000',sessions_count:1,by_subject:[{subject_id:4,name:'Física',seconds:'60.000000',minutes:'1.000000',sessions_count:1}],buckets:[{from:'2030-01-01T05:00:00Z',to:'2030-01-02T05:00:00Z',seconds:'60.000000',minutes:'1.000000'}]}
  const fetch=vi.fn().mockResolvedValue(jsonResponse(result));vi.stubGlobal('fetch',fetch)
  await service().studyTime({from:result.from,to:result.to,timezone:result.timezone,granularity:'day'})
  const query=new URL(fetch.mock.calls[0][0],'https://test').searchParams
  expect(query.get('from')).toBe(result.from);expect(query.get('to')).toBe(result.to)
  expect(query.get('timezone')).toBe('America/Bogota');expect(query.get('granularity')).toBe('day')
 })
 it('preserves timeline category and opaque cursor with the same range',async()=>{
  const fetch=vi.fn().mockResolvedValue(jsonResponse({items:[],next_cursor:null}));vi.stubGlobal('fetch',fetch)
  await service().timeline({from:'2030-01-01T00:00:00Z',to:'2030-01-08T00:00:00Z',category:'study_session',cursor:'cursor:opaque'})
  const query=new URL(fetch.mock.calls[0][0],'https://test').searchParams
  expect(query.get('category')).toBe('study_session');expect(query.get('cursor')).toBe('cursor:opaque')
  expect(query.get('from')).toBe('2030-01-01T00:00:00Z');expect(query.get('limit')).toBe('50')
 })
 it('trims a search prefix and preserves cursor for the next page',async()=>{
  const fetch=vi.fn().mockResolvedValue(jsonResponse({items:[],next_cursor:null}));vi.stubGlobal('fetch',fetch)
  await service().search(' Física ',undefined,'cursor')
  const query=new URL(fetch.mock.calls[0][0],'https://test').searchParams
  expect(query.get('prefix')).toBe('Física');expect(query.get('cursor')).toBe('cursor');expect(query.get('limit')).toBe('20')
 })
 it('does not request an empty search',async()=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch)
  await expect(service().search('   ')).rejects.toMatchObject({status:422})
  expect(fetch).not.toHaveBeenCalled()
 })
 it.each([
  {...overview,total_studied_seconds:'NaN'},
  {...overview,active_plans:-1},
  {items:[{event_id:'x',occurred_at:'2030-01-01T00:00:00Z',category:'unknown'}],next_cursor:null},
  {items:[{type:'activity',id:0,title:'x',subject_id:null,plan_id:null,status:null}],next_cursor:null},
 ])('rejects malformed Analytics DTOs instead of trusting API data',async body=>{
  const fetch=vi.fn().mockResolvedValue(jsonResponse(body));vi.stubGlobal('fetch',fetch)
  const request=Array.isArray(body.items)?service().timeline({from:'2030-01-01T00:00:00Z',to:'2030-01-02T00:00:00Z'}):service().overview()
  await expect(request).rejects.toMatchObject({code:'INVALID_RESPONSE'})
 })
})
