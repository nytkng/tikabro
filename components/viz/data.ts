// بيانات الرسومات من 016_visual_data.sql. كل دالة ترجع null إذا الـ SQL مازال ما تطبقش → الرسم يختفي.
import {db} from "@/lib/db";
import {t,type Lang} from "@/lib/i18n";
import type {Axis,PRow} from "./Viz";
export type G={kickoff:string;opponent:string;opp_id:string;at_home:boolean;gf:number;ga:number;result:"W"|"D"|"L"};
const post=(b:unknown)=>({method:"POST",body:JSON.stringify(b)});
const sc=(x:number)=>x<=1?x*100:x;

export async function probHistory(matchId:string,pick:"h"|"d"|"a"){
  const r=await db<{ph:number|null;pd:number|null;pa:number|null}[]>(`prob_history?match_id=eq.${encodeURIComponent(matchId)}&select=ph,pd,pa&order=at.asc&limit=240`).catch(()=>null);
  if(!r||r.length<2)return null;
  const f=pick==="h"?"ph":pick==="d"?"pd":"pa";
  return r.map(x=>x[f]).filter((v):v is number=>v!=null).map(v=>Math.round(sc(v)));
}

// تاريخ الاحتمالات لعدة ماتشات في استعلام واحد → {id:[[h,d,a],...]}
export async function probHistoryMany(ids:string[]){
  const out=new Map<string,[number,number,number][]>();if(!ids.length)return out;
  const q=encodeURIComponent(ids.map(x=>`"${x}"`).join(","));
  const r=await db<{match_id:string;ph:number|null;pd:number|null;pa:number|null}[]>(`prob_history?match_id=in.(${q})&select=match_id,ph,pd,pa&order=at.asc&limit=4000`).catch(()=>null);
  for(const x of r||[]){if(x.ph==null||x.pa==null)continue;const a=out.get(x.match_id)||[];a.push([Math.round(sc(x.ph)),Math.round(sc(x.pd??0)),Math.round(sc(x.pa))]);out.set(x.match_id,a)}
  for(const [k,v] of out){if(v.length<2)out.delete(k);else if(v.length>12){const st=(v.length-1)/11;out.set(k,Array.from({length:12},(_,i)=>v[Math.round(i*st)]))}}
  return out;
}

const rec=(s?:string|null)=>{if(!s||!/^\d+(-\d+){1,2}$/.test(s))return null;const a=s.split("-").map(Number);const w=a[0],d=a.length===3?a[1]:0,l=a[a.length-1];return w+d+l>0?{w,d,l,n:w+d+l}:null};

export async function teamViz(sport:string,ids:{h:string;a:string},m:{homeRec?:string|null;awayRec?:string|null;home:string;away:string},lang:Lang){
  const [gh,ga,elo]=await Promise.all([
    db<G[]>("rpc/team_stats",post({p_sport:sport,p_team:ids.h})).catch(()=>null),
    db<G[]>("rpc/team_stats",post({p_sport:sport,p_team:ids.a})).catch(()=>null),
    db<{key:string;elo:number;n:number}[]>(`team_ratings?key=in.(${encodeURIComponent(`"${sport}:${ids.h}","${sport}:${ids.a}"`)})&select=key,elo,n`).catch(()=>null)]);
  const eh=elo?.find(x=>x.key===`${sport}:${ids.h}`),ea=elo?.find(x=>x.key===`${sport}:${ids.a}`);
  const [ph,pa]=eh&&ea&&eh.n>=3&&ea.n>=3?await Promise.all([db<number|null>("rpc/sport_elo_percentile",post({p_sport:sport,p_elo:eh.elo})),db<number|null>("rpc/sport_elo_percentile",post({p_sport:sport,p_elo:ea.elo}))]).catch(()=>[null,null]):[null,null];
  const axes:Axis[]=[],rows:PRow[]=[];
  if(typeof ph==="number"&&typeof pa==="number"){axes.push({k:"elo",label:t(lang,"viz.ax_elo"),h:ph,a:pa});rows.push({label:t(lang,"viz.ax_elo"),h:ph,a:pa,pctl:true})}
  const rh=rec(m.homeRec),ra=rec(m.awayRec);
  if(rh&&ra){const h=100*rh.w/rh.n,a=100*ra.w/ra.n;axes.push({k:"win",label:t(lang,"viz.ax_win"),h,a});rows.push({label:t(lang,"viz.ax_win"),h,a,hv:`${Math.round(h)}% · ${rh.w}-${rh.d?rh.d+"-":""}${rh.l}`,av:`${Math.round(a)}% · ${ra.w}-${ra.d?ra.d+"-":""}${ra.l}`})}
  const H=gh&&gh.length>=3?gh:null,A=ga&&ga.length>=3?ga:null;
  if(H&&A){
    const pts=(g:G[])=>{const l=g.slice(0,5);return 100*l.reduce((s,x)=>s+(x.result==="W"?3:x.result==="D"?1:0),0)/(3*l.length)};
    axes.push({k:"form",label:t(lang,"viz.ax_form"),h:pts(H),a:pts(A)});
    const avg=(g:G[],f:(x:G)=>number)=>g.reduce((s,x)=>s+f(x),0)/g.length;
    const hf=avg(H,x=>x.gf),af=avg(A,x=>x.gf),hc=avg(H,x=>x.ga),ac=avg(A,x=>x.ga);
    // نسبة بين الفريقين (ماشي مقارنة مع الدوري كامل): 50 = متساويين
    const share=(x:number,y:number)=>x+y>0?100*x/(x+y):50;
    axes.push({k:"att",label:t(lang,"viz.ax_att"),h:share(hf,af),a:share(af,hf)});
    axes.push({k:"def",label:t(lang,"viz.ax_def"),h:share(ac,hc),a:share(hc,ac)});
    const fx=(v:number)=>t(lang,"viz.per_game",{v:v.toFixed(1)});
    rows.push({label:t(lang,"viz.scored"),h:share(hf,af),a:share(af,hf),hv:fx(hf),av:fx(af)});
    rows.push({label:t(lang,"viz.conceded"),h:share(hc,ac),a:share(ac,hc),hv:fx(hc),av:fx(ac)});
    const hv=H.filter(x=>x.at_home),av=A.filter(x=>!x.at_home);
    if(hv.length>=3&&av.length>=3){const w=(g:G[])=>100*g.filter(x=>x.result==="W").length/g.length;axes.push({k:"venue",label:t(lang,"viz.ax_venue"),h:w(hv),a:w(av)})}
  }
  return {axes,rows,wave:{h:H?H.slice().reverse().map(x=>x.result):[],a:A?A.slice().reverse().map(x=>x.result):[]}};
}
