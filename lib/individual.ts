// قارئ الرياضات الفردية (جدول ind_events). للخادم فقط.
import {db} from "@/lib/db";

export type IndSport="tennis"|"golf"|"f1"|"ufc";
export const IND_SPORTS:IndSport[]=["tennis","golf","f1","ufc"];
export const IND_LABEL:Record<IndSport,string>={tennis:"التنس",golf:"الغولف",f1:"الفورمولا 1",ufc:"الفنون القتالية"};
export const isIndSport=(s:string):s is IndSport=>(IND_SPORTS as string[]).includes(s);

export type IndSet={v?:number;tb?:number};
export type IndPlayer={name?:string;flag?:string;won?:boolean;sets?:IndSet[]};
export type TennisMatch={draw?:string;round?:string;start?:string;p1?:IndPlayer|null;p2?:IndPlayer|null;state?:string;detail?:string};
export type GolfRow={pos?:number|string;name?:string;flag?:string;score?:string};
export type F1Session={name?:string;start?:string;state?:string};
export type F1Result={pos?:number|string;name?:string;flag?:string;won?:boolean};
export type UfcFight={a?:IndPlayer|null;b?:IndPlayer|null;cls?:string;state?:string;detail?:string};
export type IndPayload={matches?:TennisMatch[];board?:GolfRow[];sessions?:F1Session[];results?:F1Result[];session_of_results?:string;fights?:UfcFight[];next?:{name?:string;start?:string;end?:string}[]};

export type IndEvent={id:string;sport:IndSport;tour:string|null;event_name:string|null;event_logo:string|null;start:string|null;end_date:string|null;state:string|null;detail:string|null;payload:IndPayload|null;updated_at:string|null};

const LIST_COLS="id,sport,tour,event_name,event_logo,start,end_date,state,detail,updated_at";

/** أحداث رياضة في نافذة زمنية (بلا payload باش يبقى خفيف) */
export async function listIndEvents(sport:IndSport,daysBack=7,daysAhead=14):Promise<IndEvent[]|null>{
  try{
    const from=new Date(Date.now()-daysBack*864e5).toISOString(),to=new Date(Date.now()+daysAhead*864e5).toISOString();
    const q=`ind_events?select=${LIST_COLS}&sport=eq.${sport}&state=neq.cal&start=lte.${encodeURIComponent(to)}&or=(end_date.gte.${encodeURIComponent(from)},start.gte.${encodeURIComponent(from)})&order=start.asc&limit=40`;
    return await db<IndEvent[]>(q);
  }catch{return null}
}

/** المواعيد الجاية من رزنامة الموسم */
export async function indCalendar(sport:IndSport):Promise<{tour:string|null;next:{name?:string;start?:string}[]}[]|null>{
  try{
    const r=await db<{tour:string|null;payload:IndPayload|null}[]>(`ind_events?select=tour,payload&sport=eq.${sport}&state=eq.cal`);
    return r?r.map(x=>({tour:x.tour,next:x.payload?.next??[]})):null;
  }catch{return null}
}

export async function getIndEvent(id:string):Promise<IndEvent|null>{
  try{
    const r=await db<IndEvent[]>(`ind_events?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    return r?.[0]??null;
  }catch{return null}
}
