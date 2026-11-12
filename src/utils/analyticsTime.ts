export type AnalyticsRangePreset = 'day' | 'week' | 'month' | 'custom'
export interface AnalyticsRange { from: string; to: string; timezone: string; error: string }
function dateInput(value: Date): string {
 return String(value.getFullYear()).padStart(4,'0')+'-'+String(value.getMonth()+1).padStart(2,'0')+'-'+String(value.getDate()).padStart(2,'0')
}
function localMidnight(value: string): Date | null {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
 const parts=value.split('-').map(Number), date=new Date(parts[0],parts[1]-1,parts[2])
 return date.getFullYear()===parts[0]&&date.getMonth()===parts[1]-1&&date.getDate()===parts[2]?date:null
}
export function analyticsTimezone(): string { return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC' }
export function initialRangeDates(preset: Exclude<AnalyticsRangePreset,'custom'>, now=new Date()): [string,string] {
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate())
 if(preset==='week') start.setDate(start.getDate()-((start.getDay()+6)%7))
 if(preset==='month') start.setDate(1)
 const end=new Date(start)
 if(preset==='day') end.setDate(end.getDate()+1)
 if(preset==='week') end.setDate(end.getDate()+7)
 if(preset==='month') end.setMonth(end.getMonth()+1)
 return [dateInput(start),dateInput(end)]
}
export function buildAnalyticsRange(fromDate:string,toDate:string,timezone:string):AnalyticsRange {
 const from=localMidnight(fromDate),to=localMidnight(toDate)
 if(!from||!to||to<=from) return {from:'',to:'',timezone,error:'El final del rango debe ser posterior al inicio.'}
 if(to.getTime()-from.getTime()>366*86400000) return {from:'',to:'',timezone,error:'El rango máximo es de 366 días.'}
 if(!timezone) return {from:'',to:'',timezone:'UTC',error:'No pudimos determinar la zona horaria local.'}
 return {from:from.toISOString(),to:to.toISOString(),timezone,error:''}
}
export function rangeDatesForPreset(preset:AnalyticsRangePreset,fromDate:string,toDate:string,now=new Date()):[string,string] {
 return preset==='custom'?[fromDate,toDate]:initialRangeDates(preset,now)
}
