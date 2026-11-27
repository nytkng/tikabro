// وضع اللايف: شاشة نظيفة للبث في TikTok/OBS. نسبة الجمهور ضد الـ AI تتحدث كل 20 ثانية.
export const dynamic="force-dynamic";
import {matchFromDB} from "@/lib/feed";
import {db} from "@/lib/db";
import {pickOf} from "@/lib/model";
import Crest from "@/components/Crest";
import LiveRefresh from "@/components/LiveRefresh";
import {pollByCode,openPollForMatch,pollCounts,isOpen} from "@/components/poll/lib";
export const metadata={title:"وضع اللايف"};
type K="home"|"draw"|"away";
export default async function Live({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{poll?:string}>}){
  const key=decodeURIComponent((await params).id);const eid=key.split(":")[1]||"";
  const m=/^\d{3,12}$/.test(eid)?await matchFromDB(eid).catch(()=>null):null;
  if(!m)return <p className="text-mute p-10 text-center">المباراة غير موجودة.</p>;
  const rows=await db<{pick:K}[]>(`picks?match_id=eq.${eid}&void=not.is.true&select=pick&limit=20000`);
  const c={home:0,draw:0,away:0};for(const r of rows||[])c[r.pick]++;const n=c.home+c.draw+c.away;
  const qp=String((await searchParams).poll||"");
  let poll=qp?await pollByCode(qp).catch(()=>null):null;if(poll&&(poll.match_id!==eid||!isOpen(poll)))poll=null;
  if(!poll)poll=await openPollForMatch(eid).catch(()=>null);
  const pv=poll?await pollCounts(poll.id):null;const pn=pv?pv.home+pv.draw+pv.away:0;const pp=(k:K)=>pv&&pn?Math.round(pv[k]*100/pn):0;
  const pc=(k:K)=>n?Math.round(c[k]*100/n):0;
  const p=m.probs;const ai=p?pickOf(p):null;const draw=m.sport==="football";
  const ap=(k:"h"|"d"|"a")=>p&&typeof p[k]==="number"?Math.round(p[k]*(p[k]<=1?100:1)):null;
  const col=(t:string,v:number,cls:string,sub:string|undefined,a:number|null)=><div className="flex-1 text-center">{n>0&&<div className={"font-display text-6xl tabular-nums "+cls}>{v}%</div>}<div className="text-white text-lg mt-1">{t}</div>{a!==null&&<div className="text-mute text-sm mt-1 tabular-nums">الـ AI: {a}%</div>}{sub&&<div className="text-amber text-sm mt-1">{sub}</div>}</div>;
  return(<div className="fixed inset-0 z-50 bg-[#0B0D14] flex flex-col items-center justify-center gap-8 p-6">
   <LiveRefresh on every={20}/>
   <div className="flex items-baseline gap-1"><span className="font-display text-4xl text-white">هدف</span><i className="w-3 h-3 rounded-full bg-amber inline-block"/></div>
   <div className="flex items-center gap-6 sm:gap-12">
    <div className="flex flex-col items-center gap-3 w-36 text-center"><Crest name={m.home} size={88} logo={m.homeLogo}/><b className="text-white text-xl">{m.home}</b></div>
    <div className="font-display text-6xl text-white tabular-nums">{m.score?`${m.score[0]}-${m.score[1]}`:"VS"}</div>
    <div className="flex flex-col items-center gap-3 w-36 text-center"><Crest name={m.away} size={88} logo={m.awayLogo}/><b className="text-white text-xl">{m.away}</b></div>
   </div>
   <div className="w-full max-w-3xl rounded-3xl bg-card border border-line p-6">
    <div className="text-center text-mute mb-4">{n>0?<>الجمهور · <b className="text-white tabular-nums">{n}</b> متوقع</>:<b className="text-amber text-xl">كن أول من يتوقع</b>}</div>
    <div className="flex gap-4">{col("فوز "+m.home,pc("home"),"text-violet",ai==="h"?"اختيار الـ AI":undefined,ap("h"))}{draw&&col("تعادل",pc("draw"),"text-[#9AA1B5]",ai==="d"?"اختيار الـ AI":undefined,ap("d"))}{col("فوز "+m.away,pc("away"),"text-pink",ai==="a"?"اختيار الـ AI":undefined,ap("a"))}</div>
   </div>
   {poll&&pv&&<div className="w-full max-w-3xl rounded-3xl border-2 border-amber bg-amber/10 p-5 text-center">
    <div className="text-white text-2xl sm:text-3xl font-bold">صوّت دوك: <b dir="ltr" className="text-amber break-all">tikabro.thenytkng.workers.dev/poll/{poll.code}</b></div>
    <div className="flex gap-4 mt-4">{([["home",m.home],...(draw?[["draw","تعادل"]]:[]),["away",m.away]] as [K,string][]).map(([k,lb])=><div key={k} className="flex-1"><div className="font-display text-5xl text-white tabular-nums">{pp(k)}%</div><div className="text-mute">{lb}</div></div>)}</div>
    <div className="text-mute mt-2 tabular-nums">{pn} صوت</div>
   </div>}
   <div className="text-[#C9CCE0] text-xl">توقّع معانا ضد الـ AI: <b className="text-white" dir="ltr">tikabro.thenytkng.workers.dev</b></div>
  </div>);
}
