// علاش غلط الـ AI؟ أكبر الأخطاء في آخر 14 يوم، مع تشريح صادق مبني على الأرقام، والجمهور ضد الـ AI شهريا.
export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import Crest from "@/components/Crest";
import {arLeague} from "@/lib/arabic";
export const metadata={title:"علاش غلط الـ AI؟",description:"أكبر أخطاء الـ AI تاع هدف، مشروحة بالأرقام وبلا تبرير."};
type K="home"|"draw"|"away";
type P={match_id:string;league:string|null;kickoff:string;home:string;away:string;p_home:number;p_draw:number|null;p_away:number;pick:K|null;outcome:K|null;crowd_home:number|null;crowd_draw:number|null;crowd_away:number|null;crowd_n:number|null;brier:number|null};
type M={id:string|null;eid:string;home_logo:string|null;away_logo:string|null;score_h:number|null;score_a:number|null;slug:string|null};
const sc=(x:number|null)=>x==null?0:x>1?x/100:x;
const probs=(r:P,c=false)=>c?{home:sc(r.crowd_home),draw:sc(r.crowd_draw),away:sc(r.crowd_away)}:{home:sc(r.p_home),draw:sc(r.p_draw),away:sc(r.p_away)};
const top=(p:Record<K,number>)=>(["home","draw","away"] as K[]).reduce((a,k)=>p[k]>p[a]?k:a,"home" as K);
const brier=(p:Record<K,number>,o:K)=>(["home","draw","away"] as K[]).reduce((a,k)=>a+(p[k]-(k===o?1:0))**2,0);
const name=(r:P,k:K)=>k==="home"?r.home:k==="away"?r.away:"التعادل";
const card="rounded-2xl bg-card border border-line p-5";
const MONTHS=["جانفي","فيفري","مارس","أفريل","ماي","جوان","جويلية","أوت","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function story(r:P,m:M|undefined){
  const p=probs(r),k=r.pick&&r.pick in p?r.pick:top(p),pc=Math.round(p[k]*100),o=r.outcome!;
  const score=m?.score_h!=null?`${m.score_h}-${m.score_a}`:o==="draw"?"تعادل":`فوز ${name(r,o)}`;
  const lose=Math.round((100-pc)/10);
  const lines=[`الـ AI عطى ${name(r,k)} ${pc}%، والنتيجة ${score}. في 10 مباريات كيما هذي، المفروض يخسر تقريبا ${lose}. هذي وحدة منهم.`];
  const po=Math.round(p[o]*100);
  lines.push(po<15?`النتيجة اللي صرات كان عاطيها غير ${po}%، يعني مفاجأة حقيقية حتى بمقياس النموذج.`:`النتيجة اللي صرات كان عاطيها ${po}%، ماشي مستحيلة: تقريبا مرة من كل ${Math.max(2,Math.round(100/Math.max(po,1)))}.`);
  if((r.crowd_n||0)>0&&r.crowd_home!=null){
    const c=probs(r,true),ck=top(c),cp=Math.round(c[ck]*100);
    const bm=brier(p,o),bc=brier(c,o);
    lines.push(ck===o?`الجمهور (${r.crowd_n} توقع) كان أصح: اختار ${name(r,ck)} بـ ${cp}%. هذا بالضبط علاش نزيدو وزنو كل ليلة.`
      :`حتى الجمهور (${r.crowd_n} توقع) طاح: اختار ${name(r,ck)} بـ ${cp}%. ${bc<bm?"بصح كان أقل غلط من الـ AI.":"والـ AI كان أقرب منو للواقع."}`);
  }
  return lines;
}

export default async function Learn(){
  const since=new Date(Date.now()-14*864e5).toISOString();
  const m0=new Date();m0.setUTCDate(1);m0.setUTCHours(0,0,0,0);m0.setUTCMonth(m0.getUTCMonth()-5);
  const sel="match_id,league,kickoff,home,away,p_home,p_draw,p_away,pick,outcome,crowd_home,crowd_draw,crowd_away,crowd_n,brier";
  const [rec,mon]=await Promise.all([
    db<P[]>(`predictions?settled_at=not.is.null&void=eq.false&outcome=not.is.null&kickoff=gte.${encodeURIComponent(since)}&select=${sel}&order=kickoff.desc&limit=5000`).catch(()=>null),
    db<P[]>(`predictions?settled_at=not.is.null&void=eq.false&outcome=not.is.null&crowd_n=gte.3&kickoff=gte.${encodeURIComponent(m0.toISOString())}&select=${sel}&limit=20000`).catch(()=>null)]);
  const misses=(rec||[]).map(r=>{const p=probs(r),k=r.pick&&r.pick in p?r.pick:top(p);return {r,k,pm:p[k]}})
    .filter(x=>x.pm>=0.55&&x.k!==x.r.outcome).sort((a,b)=>b.pm-a.pm).slice(0,12);
  const ids=misses.map(x=>x.r.match_id).filter(i=>/^[\w-]+$/.test(i));
  const ms=ids.length?await db<M[]>(`matches?eid=in.(${ids.join(",")})&select=id,eid,home_logo,away_logo,score_h,score_a,slug`).catch(()=>null):null;
  const byId=new Map((ms||[]).map(m=>[String(m.eid),m]));
  // الجمهور ضد الـ AI شهريا
  const agg=new Map<string,{n:number;ai:number;cr:number}>();
  for(const r of mon||[]){if(r.crowd_home==null)continue;const key=r.kickoff.slice(0,7);const a=agg.get(key)||{n:0,ai:0,cr:0};
    a.n++;a.ai+=brier(probs(r),r.outcome!);a.cr+=brier(probs(r,true),r.outcome!);agg.set(key,a)}
  const months=[...agg.entries()].sort((a,b)=>b[0].localeCompare(a[0])).map(([k,a])=>({k,n:a.n,ai:a.ai/a.n,cr:a.cr/a.n}));
  const total=(rec||[]).length;
  return(<div className="flex flex-col gap-6">
   <section className={card}>
    <h1 className="text-3xl font-bold text-white">علاش غلط الـ AI؟</h1>
    <p className="text-mute mt-2 leading-7">أكبر الأخطاء في آخر 14 يوم: المرات اللي كان فيها الـ AI عاطي 55% ولا أكثر وطاح. ما نبرروش، نشرحو بالأرقام. نموذج صادق لازم يغلط بالقدر اللي قال.</p>
    {total>0&&<p className="text-sm text-mute mt-3"><span dir="ltr" className="tabular-nums text-white">{misses.length}</span> غلطة كبيرة من <span dir="ltr" className="tabular-nums text-white">{total}</span> توقع محسوم.</p>}
   </section>
   {misses.length===0?<section className={card}><p className="text-mute">ما كاين حتى غلطة كبيرة في آخر 14 يوم، ولا مازال ما كاش توقعات محسومة.</p></section>:
   <ul className="flex flex-col gap-4">{misses.map(({r,k,pm})=>{const m=byId.get(r.match_id);return(<li key={r.match_id} className={card}>
     <div className="flex items-center gap-2 text-xs text-mute"><span>{arLeague(r.league,r.league)||r.league}</span><span dir="ltr" className="ms-auto tabular-nums">{r.kickoff.slice(0,10)}</span></div>
     <div className="flex items-center gap-3 mt-3">
      <Crest name={r.home} logo={m?.home_logo} size={32}/><bdi className={"truncate font-semibold "+(r.outcome==="home"?"text-white":"text-mute")}>{r.home}</bdi>
      <span dir="ltr" className="mx-auto font-display text-2xl text-white tabular-nums whitespace-nowrap">{m?.score_h!=null?`${m.score_h} - ${m.score_a}`:"—"}</span>
      <bdi className={"truncate font-semibold text-end "+(r.outcome==="away"?"text-white":"text-mute")}>{r.away}</bdi><Crest name={r.away} logo={m?.away_logo} size={32}/>
     </div>
     <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-amber" style={{width:`${Math.round(pm*100)}%`}}/></div>
     <p className="text-xs text-mute mt-1">ثقة الـ AI في {name(r,k)}: <b dir="ltr" className="text-amber tabular-nums">{Math.round(pm*100)}%</b></p>
     <div className="mt-3 flex flex-col gap-1.5 text-sm leading-7 text-white/90">{story(r,m).map((l,i)=><p key={i}>{l}</p>)}</div>
     <a href={`/match/${encodeURIComponent(m?.id||r.match_id)}`} className="inline-block mt-3 text-sm text-violet">تفاصيل المباراة ←</a>
   </li>)})}</ul>}
   <section className={card}>
    <h2 className="text-lg font-semibold text-white mb-1">الجمهور ضد الـ AI</h2>
    <p className="text-sm text-mute mb-4 leading-7">كل شهر، على المباريات اللي فيها 3 توقعات من الجمهور ولا أكثر، نقارنو Brier (أقل = أحسن).</p>
    {months.length===0?<p className="text-mute text-sm">مازال ما كاش مباريات كافية.</p>:
    <div className="flex flex-col">{months.map(x=>{const [y,mm]=x.k.split("-");const w=Math.abs(x.ai-x.cr)<0.005?"تعادل":x.ai<x.cr?"الـ AI":"الجمهور";return(
     <div key={x.k} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5 border-t border-line first:border-0 text-sm">
      <span className="text-white">{MONTHS[+mm-1]} <span dir="ltr">{y}</span> <span className="text-mute text-xs">(<span dir="ltr">{x.n}</span>)</span></span>
      <span className="text-violet tabular-nums" dir="ltr">AI {x.ai.toFixed(3)}</span>
      <span className="text-[#E879A6] tabular-nums" dir="ltr">{x.cr.toFixed(3)}</span>
      <span className={"text-xs rounded-full px-2 py-0.5 border "+(w==="الجمهور"?"border-[#E879A6]/50 text-[#E879A6]":w==="الـ AI"?"border-violet/50 text-violet":"border-line text-mute")}>{w}</span>
     </div>)})}</div>}
   </section>
  </div>);
}
