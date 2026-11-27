// صفحة الفريق: كل المعطيات من قاعدة البيانات (ماتشات، Elo، أهداف، سجل الـ AI)
import {db} from "./db";
import {COLS,toMatch,type Row} from "./feed";
import type {Match} from "./types";
export const TEAM_SPORTS=["soccer","basketball","hockey","football","baseball","rugby","rugby-league","volleyball","australian-football","lacrosse","field-hockey"];
export const validTeam=(sport:string,id:string)=>TEAM_SPORTS.includes(sport)&&/^(\d{1,10}|ts\d{1,10})$/.test(id);
type R=Row&{home_id:string|null;away_id:string|null};
export type TeamData={name:string;logo:string|null;slug:string|null;leagueName:string|null;league:string;
  elo:number|null;rank:number|null;total:number|null;n:number;form:string;wave:string[];last:Match[];next:Match[];
  goals:{gp:number;gf:number;ga:number}|null;ai:{hits:number;n:number}|null};
const rpc=<T,>(fn:string,body:unknown)=>db<T>(`rpc/${fn}`,{method:"POST",body:JSON.stringify(body)}).catch(()=>null);
export async function getTeam(sport:string,id:string):Promise<TeamData|null>{
  if(!validTeam(sport,id))return null;
  const c=COLS+",home_id,away_id",or=encodeURIComponent(`(home_id.eq.${id},away_id.eq.${id})`),now=encodeURIComponent(new Date().toISOString());
  const [past,fut]=await Promise.all([
    db<R[]>(`matches?sport=eq.${sport}&or=${or}&state=eq.post&select=${c}&order=kickoff.desc&limit=10`).catch(()=>null),
    db<R[]>(`matches?sport=eq.${sport}&or=${or}&state=neq.post&kickoff=gte.${now}&select=${c}&order=kickoff.asc&limit=5`).catch(()=>null)]);
  const P=past||[],F=fut||[],ref=P[0]||F[0];if(!ref)return null;
  const home=ref.home_id===id,name=home?ref.home:ref.away,logo=(home?ref.home_logo:ref.away_logo)||null;
  const res=P.filter(r=>r.score_h!==null&&r.score_a!==null).map(r=>{const me=r.home_id===id?r.score_h!:r.score_a!,op=r.home_id===id?r.score_a!:r.score_h!;return me>op?"W":me<op?"L":"D"});
  const key=`${sport}:${id}`;
  const [tr,goals,preds]=await Promise.all([
    db<{elo:number;n:number}[]>(`team_ratings?key=eq.${encodeURIComponent(key)}&select=elo,n&limit=1`).catch(()=>null),
    rpc<{gp:number;gf:number;ga:number}[]>("team_goals",{p_sport:sport,p_team:id,p_n:10}),
    P.length?db<{hit:boolean|null}[]>(`predictions?match_id=in.(${P.map(r=>r.eid).join(",")})&settled_at=not.is.null&void=eq.false&select=hit`).catch(()=>null):null]);
  const elo=tr?.[0]?.elo??null;let rank:number|null=null,total:number|null=null;
  if(elo!==null){const cnt=async(q:string)=>{const r=await fetchCount(`team_ratings?sport=eq.${sport}${q}`);return r};
    const [hi,all]=await Promise.all([cnt(`&n=gte.5&elo=gt.${elo}`),cnt("&n=gte.5")]);rank=hi===null?null:hi+1;total=all}
  const ps=(preds||[]).filter(p=>p.hit!==null);
  const g=goals?.[0];
  return {name,logo:logo||P.map(r=>r.home_id===id?r.home_logo:r.away_logo).find(Boolean)||null,slug:ref.slug,leagueName:ref.league_name,league:toMatch(ref).league,
    elo:elo!==null?Math.round(elo):null,rank,total,n:tr?.[0]?.n??0,form:res.slice(0,10).join(""),wave:[...res].reverse(),
    last:P.map(toMatch),next:F.map(toMatch),goals:g&&g.gp>0?{gp:g.gp,gf:g.gf,ga:g.ga}:null,ai:ps.length?{hits:ps.filter(p=>p.hit).length,n:ps.length}:null};
}
// عدد الصفوف عبر Content-Range (بلا جلب البيانات)
async function fetchCount(path:string):Promise<number|null>{
  const {supaOrigin}=await import("./supa");const url=supaOrigin(process.env.SUPABASE_URL),key=process.env.SUPABASE_SERVICE_KEY?.trim();
  if(!url||!key)return null;
  try{const r=await fetch(`${url}/rest/v1/${path}&select=key&limit=1`,{method:"HEAD",headers:{apikey:key,...(key.startsWith("sb_")?{}:{Authorization:`Bearer ${key}`}),Prefer:"count=exact"},cache:"no-store"});
    const m=(r.headers.get("content-range")||"").match(/\/(\d+)$/);return m?Number(m[1]):null}catch{return null}
}
