const isoDateTime=(value:string):boolean=>/(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value))
export function validQueryParameter(key:string,value:number|string):boolean {
 if(!/^[a-z_]+$/.test(key))return false
 if(typeof value==='number')return Number.isSafeInteger(value)&&value>=1
 if(key==='type')return ['activity','study_session','subject','study_plan','study_challenge'].includes(value)
 if(key==='after_type')return ['activity','study_session'].includes(value)
 if(key==='category')return ['activity','study_session','decision','plan','challenge'].includes(value)
 if(key==='granularity')return ['day','week','month'].includes(value)
 if(key==='timezone') {
  if(!value||value.length>100)return false
  try { new Intl.DateTimeFormat('en-US',{timeZone:value}); return true } catch { return false }
 }
 if(key==='prefix')return value.trim().length>0&&[...value.trim()].length<=64
 if(key==='cursor')return value.length>0&&value.length<=2048
 if(key==='from'||key==='to')return isoDateTime(value)
 if(key==='status')return ['active','archived','all','pending','in_progress','completed','partial','postponed','cancelled'].includes(value)
 if(key==='execution_state')return ['planned','running','paused','finished'].includes(value)
 if(key==='priority')return ['low','medium','high','urgent'].includes(value)
 if(key==='confirm')return value==='true'
 return ['deadline','deadline_from','deadline_to','after_deadline','planned_start_from','planned_start_to','after_planned_start_at'].includes(key)&&isoDateTime(value)
}
