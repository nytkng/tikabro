// سجل الـ AI العلني: كل توقع مختوم ومحسوم، بلا انتقاء. التجميع الثقيل في SQL (008)، وإذا غاب نحسبو هنا.
export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import Calibration,{type Bin} from "@/components/charts/Calibration";
import Meter from "@/components/charts/Meter";
import Crest from "@/components/Crest";
export const metadata={title:"سجل الـ AI"};
type S={grp:string;k:string;n:number;hits:number;brier:number|null;logloss:number|null;crowd_cnt:number;crowd_brier:number|null;model_brier_c:number|null};
type W={match_id:string;league:string|null;home:string;away:string;pick:string;outcome:string;prob:number;home_logo:string|null;away_logo:string|null;score_h:number|null;score_a:number|null};
type R={match_id:string;league:string|null;model_version:string|null;home:string;away:string;outcome:string|null;hit:boolean|null;p_home:number;p_draw:number|null;p_away:number;crowd_home:number|null;crowd_draw:number|null;crowd_away:number|null;crowd_n:number|null};
const NAMES:Record<string,string>={"eng.1":"الدوري الإنجليزي","esp.1":"الدوري الإسباني","ger.1":"الدوري الألماني","ita.1":"الدوري الإيطالي","fra.1":"الدوري الفرنسي","uefa.champions":"أبطال أوروبا","caf.champions":"أبطال أفريقيا","nba":"NBA"};
const VER:Record<string,string>={"v1-dc":"v1 · Dixon-Coles (القديم)","v0-rec-sql":"v0 · سجل SQL","v2-elo-crowd":"v2 · Elo + الجمهور"};
const OUT:Record<string,string>={home:"فوز المستقبل",draw:"تعادل",away:"فوز الضيف"};
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
  const th="font-normal pb-2 text-right";
  const Table=({rows,name}:{rows:S[];name:(k:string)=>React.ReactNode})=>(<div className="overflow-x-auto"><table className="w-full text-sm tabular-nums">
    <thead><tr className="text-mute"><th className={th}>الاسم</th><th className={th}>مباريات</th><th className={th}>إصابة</th><th className={th}>Brier</th><th className={th}>Log loss</th></tr></thead>
    <tbody>{rows.map(s=><tr key={s.k} className="border-t border-line"><td className="py-2.5 text-white">{name(s.k)}</td><td dir="ltr" className="text-right">{s.n}</td><td dir="ltr" className="text-right">{pct(s.hits,s.n)}%</td>
      <td dir="ltr" className={"text-right "+(s.brier!=null&&s.brier<0.667?"text-violet":"text-amber")}>{f3(s.brier)}</td><td dir="ltr" className="text-right text-mute">{f3(s.logloss)}</td></tr>)}</tbody></table></div>);
  return(<div className="flex flex-col gap-6">
   <section className={card}>
    <h1 className="text-3xl font-bold text-white">سجل الـ AI</h1>
    <p className="text-mute mt-2 leading-7">كل توقع مختوم قبل البداية ومحسوم بعد النهاية. ما نخبيو حتى غلطة.</p>
    {n===0?<p className="text-mute mt-6">مازال ما كاين توقعات محسومة.</p>:<>
    <dl className="grid grid-cols-3 gap-4 mt-6">
     <div><dt className="text-sm text-mute">مباريات محسومة</dt><dd className="font-display text-4xl text-white mt-1 tabular-nums" dir="ltr">{n}</dd></div>
     <div><dt className="text-sm text-mute">نسبة الإصابة</dt><dd className="font-display text-4xl text-violet mt-1 tabular-nums" dir="ltr">{pct(hits,n)}%</dd></div>
     <div><dt className="text-sm text-mute">Brier (أقل = أحسن)</dt><dd className="font-display text-4xl text-white mt-1 tabular-nums" dir="ltr">{f3(brier)}</dd></div>
    </dl>
    {brier!=null&&<div className="mt-5 flex flex-col gap-3"><Meter label="الـ AI تاعنا" value={brier} color="#8B7CFF"/><Meter label="اللي يعطي 33% لكل نتيجة" value={0.667} color="#9AA1B5"/></div>}
    <p className="text-sm text-mute mt-4 leading-7">Brier يقيس قداش كانت الاحتمالات بعيدة على الواقع. واحد ما يعرف والو ويعطي ثلث لكل نتيجة ياخذ ‎0.667 ديما؛ كل ما نقص الرقم تحتو، كل ما كان الـ AI أصدق.</p></>}
   </section>

   {vers.length>0&&<section className={card}><h2 className="text-lg font-semibold text-white mb-4">مقارنة نسخ النموذج</h2><Table rows={vers} name={k=><bdi>{VER[k]||k}</bdi>}/></section>}
   {lgs.length>0&&<section className={card}><h2 className="text-lg font-semibold text-white mb-4">حسب الدوري</h2><Table rows={lgs} name={k=>NAMES[k]||<bdi>{k}</bdi>}/></section>}

   {n>0&&<section className={card}>
    <h2 className="text-lg font-semibold text-white mb-1">هل يصدق في احتمالاتو؟</h2>
    <p className="text-sm text-mute mb-5 leading-7">كي يقول الـ AI «60%»، لازم الحاجة تصرا قريب 6 مرات من 10. الإطار هو واش قال، والمعبّى هو واش صرا. كي يتساواو، النموذج صادق.</p>
    <Calibration bins={bins}/>
    <p className="text-xs text-mute mt-3">الأعمدة الباهتة فيها عينة صغيرة (أقل من 20) وتتقلب بزاف.</p>
   </section>}

   {cN>0&&cB!=null&&mB!=null&&<section className={card}>
    <h2 className="text-lg font-semibold text-white mb-1">الـ AI ضد الجمهور</h2>
    <p className="text-sm text-mute mb-4 leading-7">على <span dir="ltr" className="tabular-nums">{cN}</span> مباراة فيها توقعات الجمهور، نقارنو Brier تاع الزوج على نفس المباريات.</p>
    <div className="flex flex-col gap-3"><Meter label="الـ AI" value={mB} color="#8B7CFF"/><Meter label="الجمهور" value={cB} color="#E879A6"/></div>
    <p className="mt-4 font-semibold text-white">{Math.abs(mB-cB)<0.005?"تقريبا متعادلين.":mB<cB?"الـ AI أصدق من الجمهور حتى لدرك.":"الجمهور أصدق من الـ AI حتى لدرك، وهذا علاش نزيدو وزنو."}</p>
   </section>}

   {worst.length>0&&<section className={card}>
    <h2 className="text-lg font-semibold text-white mb-1">أكبر الأخطاء</h2>
    <p className="text-sm text-mute mb-4">المرات اللي كان فيها الـ AI متأكد بزاف وطاح. نوريوهم باش تعرف حدودو.</p>
    <ul className="flex flex-col">{worst.map(w=><li key={w.match_id} className="flex items-center gap-3 py-2.5 border-t border-line first:border-0 text-sm">
      <Crest name={w.home} logo={w.home_logo} size={24}/><bdi className="text-white truncate">{w.home}</bdi>
      {w.score_h!=null&&<span dir="ltr" className="tabular-nums text-mute">{w.score_h}-{w.score_a}</span>}
      <bdi className="text-white truncate">{w.away}</bdi><Crest name={w.away} logo={w.away_logo} size={24}/>
      <span className="ms-auto text-mute whitespace-nowrap">قال {OUT[w.pick]} <b dir="ltr" className="text-amber tabular-nums">{Math.round(w.prob*100)}%</b> · صرا {OUT[w.outcome]}</span></li>)}</ul>
   </section>}

   <section className={card}>
    <h2 className="text-lg font-semibold text-white mb-2">كيف يتعلّم؟</h2>
    <ol className="list-decimal pr-5 text-sm text-mute leading-7 flex flex-col gap-1">
     <li>كل فريق عندو تقييم <bdi>Elo</bdi>: يطلع كي يربح ويهبط كي يخسر، وقداش يتحرك يتعلق بقوة الخصم.</li>
     <li>من فرق التقييم نحسبو احتمالات الفوز والتعادل والخسارة.</li>
     <li>نخلطو هذي الاحتمالات مع توقعات الجمهور بوزن خاص بكل دوري.</li>
     <li>كل ليلة نجربو أوزان مختلفة على المباريات اللي فاتت ونخلّيو اللي عطات أقل Brier.</li>
    </ol>
   </section>
  </div>);
}
