// سجل الـ AI العلني: كل توقع مختوم ومحسوم، بلا انتقاء. التجميع الثقيل في SQL (008)، وإذا غاب نحسبو هنا.
export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import Calibration,{type Bin} from "@/components/charts/Calibration";
import Meter from "@/components/charts/Meter";
import Crest from "@/components/Crest";
import {arLeague} from "@/lib/arabic";
import {LeagueBubbles} from "@/components/viz/Viz";
import {getLang} from "@/lib/lang";
import {t,type Lang} from "@/lib/i18n";
import MarketsRecord from "@/components/MarketsRecord";
export async function generateMetadata(){return {title:t(await getLang(),"ai.title")}}
type S={grp:string;k:string;n:number;hits:number;brier:number|null;logloss:number|null;crowd_cnt:number;crowd_brier:number|null;model_brier_c:number|null};
type W={match_id:string;league:string|null;home:string;away:string;pick:string;outcome:string;prob:number;home_logo:string|null;away_logo:string|null;score_h:number|null;score_a:number|null};
type R={match_id:string;league:string|null;model_version:string|null;home:string;away:string;outcome:string|null;hit:boolean|null;p_home:number;p_draw:number|null;p_away:number;crowd_home:number|null;crowd_draw:number|null;crowd_away:number|null;crowd_n:number|null};
const NAMES:Record<string,string>={"eng.1":"الدوري الإنجليزي","esp.1":"الدوري الإسباني","ger.1":"الدوري الألماني","ita.1":"الدوري الإيطالي","fra.1":"الدوري الفرنسي","uefa.champions":"أبطال أوروبا","caf.champions":"أبطال أفريقيا","nba":"NBA"};
const VER=(l:Lang):Record<string,string>=>({"v1-dc":t(l,"ai.v1"),"v0-rec-sql":t(l,"ai.v0"),"v2-elo-crowd":t(l,"ai.v2")});
const OUT=(l:Lang,k:string)=>k==="home"?t(l,"ai.out.home"):k==="draw"?t(l,"ai.out.draw"):k==="away"?t(l,"ai.out.away"):k;
const pct=(a:number,b:number)=>b?Math.round(100*a/b):0;
const f3=(x:number|null|undefined)=>x==null?"—":x.toFixed(3);
const sc=(x:number|null)=>x==null?null:x>1?x/100:x;

function local(rows:R[]){
  const ok=rows.filter(r=>r.outcome);
  const agg=new Map<string,S>();const bins:Bin[]=Array.from({length:10},()=>({said:0,happened:0,n:0}));const worst:W[]=[];
  for(const r of ok){
    const p={home:sc(r.p_home)!,draw:sc(r.p_draw)??0,away:sc(r.p_away)!};const o=r.outcome as keyof typeof p;
    const bm=(["home","draw","away"] as const).reduce((a,k)=>a+(p[k]-(k===o?1:0))**2,0);
    const ll=-Math.log(Math.max(1e-6,p[o]));
    const hasC=(r.crowd_n||0)>0&&r.crowd_home!=null;
    const c={home:r.crowd_home??0,draw:r.crowd_draw??0,away:r.crowd_away??0};
    const bc=hasC?(["home","draw","away"] as const).reduce((a,k)=>a+(c[k]-(k===o?1:0))**2,0):null;
    const pk=(["home","draw","away"] as const).reduce((a,k)=>p[k]>p[a]?k:a,"home" as "home"|"draw"|"away");
    for(const [g,k] of [["version",r.model_version||"?"],["league",r.league||"?"]]){
      const key=g+"|"+k;let s=agg.get(key);if(!s){s={grp:g,k,n:0,hits:0,brier:0,logloss:0,crowd_cnt:0,crowd_brier:0,model_brier_c:0};agg.set(key,s)}
      s.n++;if(pk===o)s.hits++;s.brier!+=bm;s.logloss!+=ll;if(bc!=null){s.crowd_cnt++;s.crowd_brier!+=bc;s.model_brier_c!+=bm}}
    for(const k of ["home","draw","away"] as const){if(r.p_draw==null&&k==="draw")continue;const i=Math.min(9,Math.floor(p[k]*10));bins[i].said+=p[k];bins[i].happened+=k===o?1:0;bins[i].n++}
    if(pk!==o)worst.push({match_id:r.match_id,league:r.league,home:r.home,away:r.away,pick:pk,outcome:o,prob:p[pk],home_logo:null,away_logo:null,score_h:null,score_a:null});
  }
  const summary=[...agg.values()].map(s=>({...s,brier:s.brier!/s.n,logloss:s.logloss!/s.n,crowd_brier:s.crowd_cnt?s.crowd_brier!/s.crowd_cnt:null,model_brier_c:s.crowd_cnt?s.model_brier_c!/s.crowd_cnt:null})).sort((a,b)=>b.n-a.n);
  return {summary,bins:bins.map(b=>({said:b.n?b.said/b.n:0,happened:b.n?b.happened/b.n:0,n:b.n})),worst:worst.sort((a,b)=>b.prob-a.prob).slice(0,8)};
}

export default async function AI(){
  const lang=await getLang();
  const [s0,c0,w0]=await Promise.all([db<S[]>("rpc/ai_summary"),db<Bin[]>("rpc/ai_calibration",{method:"POST",body:"{}"}),db<W[]>("rpc/ai_worst?p_limit=8")]);
  let summary=s0,bins=c0,worst=w0;
  if(!summary||!bins||!worst){
    const rows=(await db<R[]>("predictions?settled_at=not.is.null&void=eq.false&outcome=not.is.null&select=match_id,league,model_version,home,away,outcome,hit,p_home,p_draw,p_away,crowd_home,crowd_draw,crowd_away,crowd_n&order=settled_at.desc&limit=5000"))||[];
    const l=local(rows);summary=summary||l.summary;bins=bins||l.bins;worst=worst||l.worst;
  }
  const vers=summary.filter(s=>s.grp==="version"),lgs=summary.filter(s=>s.grp==="league");
  const n=vers.reduce((a,s)=>a+s.n,0),hits=vers.reduce((a,s)=>a+s.hits,0);
  const wavg=(f:(s:S)=>number|null,w:(s:S)=>number)=>{let a=0,b=0;for(const s of vers){const v=f(s);if(v!=null){a+=v*w(s);b+=w(s)}}return b?a/b:null};
  const brier=wavg(s=>s.brier,s=>s.n),cN=vers.reduce((a,s)=>a+s.crowd_cnt,0);
  const cB=wavg(s=>s.crowd_brier,s=>s.crowd_cnt),mB=wavg(s=>s.model_brier_c,s=>s.crowd_cnt);
  const card="rounded-2xl bg-card border border-line p-5";
  const th="font-normal pb-2 text-start";const T=(k:Parameters<typeof t>[1],v?:Record<string,string|number>)=>t(lang,k,v);
  const Table=({rows,name}:{rows:S[];name:(k:string)=>React.ReactNode})=>(<div className="overflow-x-auto"><table className="w-full text-sm tabular-nums">
    <thead><tr className="text-mute"><th className={th}>{T("ai.col.name")}</th><th className={th}>{T("ai.col.n")}</th><th className={th}>{T("ai.col.hit")}</th><th className={th}>Brier</th><th className={th}>Log loss</th></tr></thead>
    <tbody>{rows.map(s=><tr key={s.k} className="border-t border-line"><td className="py-2.5 text-white">{name(s.k)}</td><td dir="ltr" className="text-start">{s.n}</td><td dir="ltr" className="text-start">{pct(s.hits,s.n)}%</td>
      <td dir="ltr" className={"text-start "+(s.brier!=null&&s.brier<0.667?"text-violet":"text-amber")}>{f3(s.brier)}</td><td dir="ltr" className="text-start text-mute">{f3(s.logloss)}</td></tr>)}</tbody></table></div>);
  return(<div className="flex flex-col gap-6">
   <section className={card}>
    <h1 className="text-3xl font-bold text-white">{T("ai.title")}</h1>
    <p className="text-mute mt-2 leading-7">{T("ai.intro")}</p>
    {n===0?<p className="text-mute mt-6">{T("ai.none")}</p>:<>
    <dl className="grid grid-cols-3 gap-4 mt-6">
     <div><dt className="text-sm text-mute">{T("ai.settled")}</dt><dd className="font-display text-4xl text-white mt-1 tabular-nums" dir="ltr">{n}</dd></div>
     <div><dt className="text-sm text-mute">{T("ai.rate")}</dt><dd className="font-display text-4xl text-violet mt-1 tabular-nums" dir="ltr">{pct(hits,n)}%</dd></div>
     <div><dt className="text-sm text-mute">{T("ai.brier_lower")}</dt><dd className="font-display text-4xl text-white mt-1 tabular-nums" dir="ltr">{f3(brier)}</dd></div>
    </dl>
    {brier!=null&&<div className="mt-5 flex flex-col gap-3"><Meter label={T("ai.ours")} value={brier} color="#8B7CFF" lang={lang}/><Meter label={T("ai.uniform")} value={0.667} color="#9AA1B5" lang={lang}/></div>}
    <p className="text-sm text-mute mt-4 leading-7">{T("ai.brier_note")}</p></>}
   </section>

   {vers.length>0&&<section className={card}><h2 className="text-lg font-semibold text-white mb-4">{T("ai.versions")}</h2><Table rows={vers} name={k=><bdi>{VER(lang)[k]||k}</bdi>}/></section>}
   {lgs.length>0&&<section className={card}><h2 className="text-lg font-semibold text-white mb-4">{T("ai.by_league")}</h2><Table rows={lgs} name={k=>(lang==="ar"?arLeague(k)||NAMES[k]:null)||<bdi>{k}</bdi>}/></section>}

   {lgs.filter(s=>s.n>=5).length>=2&&<section className={card}><h2 className="text-lg font-semibold text-white mb-1">{t(lang,"viz.bubble")}</h2>
    <p className="text-sm text-mute mb-4 leading-7">{t(lang,"viz.bubble_note")}</p>
    <LeagueBubbles lang={lang} data={lgs.map(s=>({k:s.k,label:(lang==="ar"?arLeague(s.k)||NAMES[s.k]:null)||s.k,n:s.n,hit:pct(s.hits,s.n)}))}/></section>}

   {(()=>{const L=lgs.filter(s=>s.n>=10&&s.brier!=null).map(s=>({s,sk:1-(s.brier as number)/0.667})).sort((a,b)=>b.sk-a.sk);if(L.length<2)return null;const mx=Math.max(.01,...L.map(x=>x.sk));
    return <section className={card}><h2 className="text-lg font-semibold text-white mb-1">{T("tr.title")}</h2><p className="text-sm text-mute mb-4 leading-7">{T("tr.note")}</p>
     <ul className="flex flex-col gap-2.5">{L.slice(0,20).map(({s,sk})=>{const c=sk>=.12?"#2FBF71":sk>=.03?"#FFB020":"#E5484D";const lb=sk>=.12?"tr.high":sk>=.03?"tr.mid":"tr.low";
      return <li key={s.k} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-center text-sm"><span className="truncate text-white">{(lang==="ar"?arLeague(s.k)||NAMES[s.k]:null)||<bdi>{s.k}</bdi>} <span className="text-mute text-xs tabular-nums" dir="ltr">({s.n})</span></span>
       <span className="text-xs font-semibold" style={{color:c}}>{T(lb as Parameters<typeof t>[1])}</span>
       <span className="col-span-2 h-1.5 rounded-full bg-white/5 overflow-hidden"><i className="block h-full rounded-full" style={{width:`${Math.max(3,Math.round(100*Math.max(0,sk)/mx))}%`,background:c}}/></span></li>})}</ul></section>})()}
   {n>0&&<section className={card}>
    <h2 className="text-lg font-semibold text-white mb-1">{T("ai.calib")}</h2>
    <p className="text-sm text-mute mb-5 leading-7">{T("ai.calib_note")}</p>
    <Calibration bins={bins} lang={lang}/>
    <p className="text-xs text-mute mt-3">{T("ai.calib_small")}</p>
   </section>}
   <MarketsRecord lang={lang}/>

   {cN>0&&cB!=null&&mB!=null&&<section className={card}>
    <h2 className="text-lg font-semibold text-white mb-1">{T("ai.vs_crowd")}</h2>
    <p className="text-sm text-mute mb-4 leading-7">{T("ai.vs_note",{n:cN})}</p>
    <div className="flex flex-col gap-3"><Meter label={T("ai.ai")} value={mB} color="#8B7CFF" lang={lang}/><Meter label={T("ai.crowd")} value={cB} color="#E879A6" lang={lang}/></div>
    <p className="mt-4 font-semibold text-white">{T(Math.abs(mB-cB)<0.005?"ai.tie":mB<cB?"ai.ai_better":"ai.crowd_better")}</p>
   </section>}

   {worst.length>0&&<section className={card}>
    <h2 className="text-lg font-semibold text-white mb-1">{T("ai.worst")}</h2>
    <p className="text-sm text-mute mb-4">{T("ai.worst_note")}</p>
    <ul className="flex flex-col">{worst.map(w=><li key={w.match_id} className="flex items-center gap-3 py-2.5 border-t border-line first:border-0 text-sm">
      <Crest name={w.home} logo={w.home_logo} size={24}/><bdi className="text-white truncate">{w.home}</bdi>
      {w.score_h!=null&&<span dir="ltr" className="tabular-nums text-mute">{w.score_h}-{w.score_a}</span>}
      <bdi className="text-white truncate">{w.away}</bdi><Crest name={w.away} logo={w.away_logo} size={24}/>
      <span className="ms-auto text-mute whitespace-nowrap">{T("ai.said",{p:OUT(lang,w.pick),pc:Math.round(w.prob*100)+"%",o:OUT(lang,w.outcome)})}</span></li>)}</ul>
   </section>}

   <section className={card}>
    <h2 className="text-lg font-semibold text-white mb-2">{T("ai.how")}</h2>
    <ol className="list-decimal ps-5 text-sm text-mute leading-7 flex flex-col gap-1">
     {(["ai.how1","ai.how2","ai.how3","ai.how4"] as const).map(k=><li key={k}>{T(k)}</li>)}
    </ol>
   </section>
  </div>);
}
