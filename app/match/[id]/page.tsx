import {getDay} from "@/lib/day";
import Crest from "@/components/Crest";
import {pickOf} from "@/lib/model";
import {currentPlayer} from "@/lib/auth";
import {db} from "@/lib/db";
import Markets from "@/components/Markets";
import PickButtons from "@/components/PickButtons";
import CrowdVsAI from "@/components/CrowdVsAI";
export default async function MatchPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const key=decodeURIComponent(id);
  const date=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
  const m=(await getDay(date)).find(x=>x.id===key);
  if(!m)return <div className="text-mute py-20 text-center">المباراة غير موجودة اليوم. <a className="underline" href="/">ارجع للأرينا</a></div>;
  const p=m.probs;const pk=p?pickOf(p):null;
  const me=await currentPlayer();
  const eid=key.split(":")[1];
  const mine=me&&!m.sample?(await db<{pick:"home"|"draw"|"away"}[]>(`picks?player_id=eq.${me.id}&match_id=eq.${eid}&select=pick&limit=1`))?.[0]?.pick??null:null;
  const open=m.state==="pre"&&!m.sample;
  const sealRow=m.sample?null:(await db<{p_home:number;p_draw:number;p_away:number;model_version:string}[]>(`predictions?match_id=eq.${eid}&select=p_home,p_draw,p_away,model_version&limit=1`))?.[0]??null;
  const sc=(x:number)=>Math.round(x<=1?x*100:x);
  const pp=sealRow&&m.sport==="football"?{h:sc(sealRow.p_home),d:sc(sealRow.p_draw),a:100-sc(sealRow.p_home)-sc(sealRow.p_draw)}:p;
  const pk2=pp?pickOf(pp):null;
  const sealed=!!sealRow;
  type K="home"|"draw"|"away";
  const rows=m.sample?null:await db<{pick:K}[]>(`picks?match_id=eq.${eid}&void=not.is.true&select=pick&limit=10000`);
  const counts:Record<K,number>={home:0,draw:0,away:0};for(const r of rows||[])if(r.pick in counts)counts[r.pick]++;
  const aiK:K|null=pk2==="h"?"home":pk2==="a"?"away":pk2==="d"?"draw":null;
  const outcome:K|null=m.state==="post"&&m.score?(m.score[0]>m.score[1]?"home":m.score[0]<m.score[1]?"away":"draw"):null;
  return(<div className="flex flex-col gap-6">
   <section className="rounded-[20px] bg-surface border border-line p-7 flex flex-wrap items-center justify-between gap-6">
    <div className="flex items-center gap-4"><Crest name={m.home} size={64}/><span className="text-2xl font-bold text-white">{m.home}</span></div>
    <div className="text-4xl font-bold text-white">{m.score?`${m.score[0]} - ${m.score[1]}`:new Date(m.kickoff).toLocaleTimeString("ar-DZ",{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"})}</div>
    <div className="flex items-center gap-4"><span className="text-2xl font-bold text-white">{m.away}</span><Crest name={m.away} size={64}/></div></section>
   {pp?<section className="rounded-[20px] bg-surface border border-line p-7 flex flex-wrap items-center gap-6">
     <div className={"seal w-[120px] h-[120px] rounded-full border-[3px] flex items-center justify-center flex-none "+(sealed?"border-amber bg-[#2A2110]":"border-line bg-bg opacity-80")}><div className="w-[100px] h-[100px] rounded-full border border-dashed border-amber flex flex-col items-center justify-center text-amber"><b className="text-xl">{sealed?"مختوم":"مباشر"}</b><span className="text-[11px]">{sealed?"قبل البداية":"لم يُختم بعد"}</span></div></div>
     <div className="flex-1 min-w-[240px]"><div className="text-sm text-mute">{sealed?"توقع الـ AI المختوم":"تقدير الـ AI الآن (يُختم قبل البداية)"}</div><div className="text-3xl font-bold text-white my-1">{pk2==="h"?`فوز ${m.home}`:pk2==="a"?`فوز ${m.away}`:"تعادل"}</div>
      <div className="flex h-3 rounded-full overflow-hidden gap-[3px] mt-3"><i style={{width:pp!.h+"%"}} className="bg-violet"/>{pp!.d>0&&<i style={{width:pp!.d+"%"}} className="bg-[#4A5273]"/>}<i style={{width:pp!.a+"%"}} className="bg-pink"/></div>
      <div className="flex justify-between text-sm mt-2"><span>{m.home} <bdi dir="ltr">{pp!.h}%</bdi></span>{pp!.d>0&&<span>تعادل <bdi dir="ltr">{pp!.d}%</bdi></span>}<span>{m.away} <bdi dir="ltr">{pp!.a}%</bdi></span></div></div></section>
   :<section className="rounded-[20px] bg-surface border border-line p-7 text-mute">لا توقع لهذه المباراة بعد، لأن البيانات غير كافية. لا نخمّن.</section>}
   <section className="rounded-[20px] bg-surface border border-line p-7"><h2 className="text-lg font-semibold text-white mb-1">توقعك</h2>
    {m.sample?<p className="text-sm text-mute">مباراة تجريبية، ما فيها ختم.</p>
    :!open?<p className="text-sm text-mute">{mine?`توقعك المختوم: ${mine==="home"?"فوز "+m.home:mine==="away"?"فوز "+m.away:"تعادل"}. `:""}التوقعات مقفولة لأن المباراة بدأت.</p>
    :me?<><p className="text-sm text-mute mb-4">اختر قبل البداية. يُختم باسمك <b className="text-white">{me.nick}</b> وتقدر تبدلو لحد الصافرة.</p><PickButtons matchId={key} home={m.home} away={m.away} hasDraw={m.sport==="football"} current={mine}/></>
    :<><p className="text-sm text-mute mb-4">سجّل الدخول لتختم توقعك قبل البداية.</p><a href="/login" className="btn inline-flex items-center px-6 rounded-xl bg-violet text-bg font-semibold">دخول لتختم توقعك</a></>}
   </section>
   {!m.sample&&<CrowdVsAI home={m.home} away={m.away} hasDraw={m.sport==="football"} counts={counts} ai={aiK} mine={mine} revealed={!!mine||!open} outcome={outcome}/>}
   {m.ext&&<Markets x={m.ext} home={m.home} away={m.away}/>}
  </div>);
}
