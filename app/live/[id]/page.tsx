// وضع اللايف: شاشة نظيفة للبث في TikTok/OBS. نسبة الجمهور ضد الـ AI تتحدث كل 20 ثانية.
export const dynamic="force-dynamic";
import {matchFromDB} from "@/lib/feed";
import {db} from "@/lib/db";
import {pickOf} from "@/lib/model";
import Crest from "@/components/Crest";
import LiveRefresh from "@/components/LiveRefresh";
export const metadata={title:"وضع اللايف"};
type K="home"|"draw"|"away";
export default async function Live({params}:{params:Promise<{id:string}>}){
  const key=decodeURIComponent((await params).id);const eid=key.split(":")[1]||"";
  const m=/^\d{3,12}$/.test(eid)?await matchFromDB(eid).catch(()=>null):null;
  if(!m)return <p className="text-mute p-10 text-center">المباراة غير موجودة.</p>;
  const rows=await db<{pick:K}[]>(`picks?match_id=eq.${eid}&void=not.is.true&select=pick&limit=20000`);
  const c={home:0,draw:0,away:0};for(const r of rows||[])c[r.pick]++;const n=c.home+c.draw+c.away;
  const pc=(k:K)=>n?Math.round(c[k]*100/n):0;
  const p=m.probs;const ai=p?pickOf(p):null;const draw=m.sport==="football";
  const col=(t:string,v:number,cls:string,sub?:string)=><div className="flex-1 text-center"><div className={"font-display text-6xl tabular-nums "+cls}>{v}%</div><div className="text-white text-lg mt-1">{t}</div>{sub&&<div className="text-amber text-sm mt-1">{sub}</div>}</div>;
  return(<div className="fixed inset-0 z-50 bg-[#0B0D14] flex flex-col items-center justify-center gap-8 p-6">
   <LiveRefresh on every={20}/>
   <div className="flex items-baseline gap-1"><span className="font-display text-4xl text-white">هدف</span><i className="w-3 h-3 rounded-full bg-amber inline-block"/></div>
   <div className="flex items-center gap-6 sm:gap-12">
    <div className="flex flex-col items-center gap-3 w-36 text-center"><Crest name={m.home} size={88} logo={m.homeLogo}/><b className="text-white text-xl">{m.home}</b></div>
    <div className="font-display text-6xl text-white tabular-nums">{m.score?`${m.score[0]}-${m.score[1]}`:"VS"}</div>
    <div className="flex flex-col items-center gap-3 w-36 text-center"><Crest name={m.away} size={88} logo={m.awayLogo}/><b className="text-white text-xl">{m.away}</b></div>
   </div>
   <div className="w-full max-w-3xl rounded-3xl bg-card border border-line p-6">
    <div className="text-center text-mute mb-4">الجمهور · <b className="text-white tabular-nums">{n}</b> متوقع</div>
    <div className="flex gap-4">{col("فوز "+m.home,pc("home"),"text-violet",ai==="h"?"اختيار الـ AI":undefined)}{draw&&col("تعادل",pc("draw"),"text-[#9AA1B5]",ai==="d"?"اختيار الـ AI":undefined)}{col("فوز "+m.away,pc("away"),"text-pink",ai==="a"?"اختيار الـ AI":undefined)}</div>
   </div>
   <div className="text-[#C9CCE0] text-xl">توقّع معانا ضد الـ AI: <b className="text-white" dir="ltr">tikabro.thenytkng.workers.dev</b></div>
  </div>);
}
