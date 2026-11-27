// المباريات من قاعدة البيانات (Postgres يجيبها من المصدر كل 5 دقائق). صف صغير لكل ماتش، سريع وخفيف.
import {db} from "./db";
import {predict,predictTwoWay,type Rec} from "./model";
import type {Match,Sport} from "./types";
import {arLeague} from "./arabic";
export type Row={id:string;eid:string;sport:string;slug:string|null;league_name:string|null;league_logo:string|null;kickoff:string;state:string|null;detail:string|null;clock:string|null;home:string;away:string;home_logo:string|null;away_logo:string|null;home_rec:string|null;away_rec:string|null;score_h:number|null;score_a:number|null;home_form?:string|null;away_form?:string|null};
const SPORT:Record<string,Sport>={soccer:"football",basketball:"basketball",hockey:"hockey",football:"american",baseball:"baseball",rugby:"rugby","rugby-league":"rugby",volleyball:"volleyball","australian-football":"aussie"};
const rec=(s:string|null):Rec|null=>{if(!s||!/^\d+(-\d+){1,2}$/.test(s))return null;const a=s.split("-").map(Number);return a.length===3?{w:a[0],d:a[1],l:a[2]}:{w:a[0],d:0,l:a[1]}};
export const COLS="id,eid,sport,slug,league_name,league_logo,kickoff,state,detail,clock,home,away,home_logo,away_logo,home_rec,away_rec,score_h,score_a";
// أعمدة الفورمة (016) اختيارية: إذا ما زال ما تطبقش الـ SQL، نعاودو بلاها
const FCOLS=COLS+",home_form,away_form";
async function sel(q:(c:string)=>string){return (await db<Row[]>(q(FCOLS)))??(await db<Row[]>(q(COLS)))}
export function toMatch(r:Row):Match{
  const sport=SPORT[r.sport]||"football",h=rec(r.home_rec),a=rec(r.away_rec);
  const n=(x:Rec|null)=>x?x.w+x.d+x.l:0;
  const probs=h&&a&&n(h)>0&&n(a)>0?(sport==="football"||sport==="rugby"?predict(h,a):predictTwoWay(h,a)):undefined;
  const st=r.state==="in"?"live":r.state==="post"?"post":"pre";
  return {id:`${r.sport}-${r.slug||"all"}:${r.eid}`,sport,league:arLeague(r.slug,r.league_name),leagueRaw:r.league_name,slug:r.slug||"all",home:r.home,away:r.away,kickoff:r.kickoff,state:st,
    score:st!=="pre"&&r.score_h!==null&&r.score_a!==null?[r.score_h,r.score_a]:undefined,probs,source:"espn",
    leagueLogo:r.league_logo,homeLogo:r.home_logo,awayLogo:r.away_logo,detail:r.detail,clock:r.clock,homeRec:r.home_rec,awayRec:r.away_rec,homeForm:r.home_form??null,awayForm:r.away_form??null};
}
// يوم بتوقيت الجزائر
export async function dayFromDB(date:string):Promise<Match[]|null>{
  const start=new Date(date+"T00:00:00+01:00").toISOString(),end=new Date(Date.parse(start)+864e5).toISOString();
  const rows=await sel(c=>`matches?kickoff=gte.${encodeURIComponent(start)}&kickoff=lt.${encodeURIComponent(end)}&select=${c}&order=kickoff.asc&limit=3000`);
  if(!rows||!rows.length)return null;
  return rows.map(toMatch);
}
export async function matchFromDB(eid:string):Promise<Match|null>{
  const r=await sel(c=>`matches?eid=eq.${encodeURIComponent(eid)}&select=${c}&limit=1`);
  return r?.[0]?toMatch(r[0]):null;
}
export async function teamIds(eid:string){
  const r=await db<{home_id:string|null;away_id:string|null}[]>(`matches?eid=eq.${encodeURIComponent(eid)}&select=home_id,away_id&limit=1`);
  const x=r?.[0];return x?.home_id&&x?.away_id?{h:x.home_id,a:x.away_id}:null;
}
