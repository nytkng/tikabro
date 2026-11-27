import {getDay} from "@/lib/day";
import Crest from "@/components/Crest";
import {pickOf} from "@/lib/model";
export const revalidate=60;
export default async function MatchPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const key=decodeURIComponent(id);
  const date=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
  const m=(await getDay(date)).find(x=>x.id===key);
  if(!m)return <div className="text-mute py-20 text-center">المباراة غير موجودة اليوم. <a className="underline" href="/">ارجع للأرينا</a></div>;
  const p=m.probs;const pk=p?pickOf(p):null;
  return(<div className="flex flex-col gap-6">
   <section className="rounded-[20px] bg-surface border border-line p-7 flex flex-wrap items-center justify-between gap-6">
    <div className="flex items-center gap-4"><Crest name={m.home} size={64}/><span className="text-2xl font-bold text-white">{m.home}</span></div>
    <div className="text-4xl font-bold text-white">{m.score?`${m.score[0]} - ${m.score[1]}`:new Date(m.kickoff).toLocaleTimeString("ar-DZ",{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"})}</div>
    <div className="flex items-center gap-4"><span className="text-2xl font-bold text-white">{m.away}</span><Crest name={m.away} size={64}/></div></section>
   {p?<section className="rounded-[20px] bg-surface border border-line p-7 flex flex-wrap items-center gap-6">
     <div className="seal w-[120px] h-[120px] rounded-full border-[3px] border-amber bg-[#2A2110] flex items-center justify-center flex-none"><div className="w-[100px] h-[100px] rounded-full border border-dashed border-amber flex flex-col items-center justify-center text-amber"><b className="text-xl">مختوم</b><span className="text-[11px]">قبل البداية</span></div></div>
     <div className="flex-1 min-w-[240px]"><div className="text-sm text-mute">توقع الـ AI</div><div className="text-3xl font-bold text-white my-1">{pk==="h"?`فوز ${m.home}`:pk==="a"?`فوز ${m.away}`:"تعادل"}</div>
      <div className="flex h-3 rounded-full overflow-hidden gap-[3px] mt-3"><i style={{width:p.h+"%"}} className="bg-violet"/><i style={{width:p.d+"%"}} className="bg-[#4A5273]"/><i style={{width:p.a+"%"}} className="bg-pink"/></div>
      <div className="flex justify-between text-sm mt-2"><span>{m.home} {p.h}%</span><span>تعادل {p.d}%</span><span>{m.away} {p.a}%</span></div></div></section>
   :<section className="rounded-[20px] bg-surface border border-line p-7 text-mute">لا توقع لهذه المباراة بعد، لأن البيانات غير كافية. لا نخمّن.</section>}
   <section className="rounded-[20px] bg-surface border border-line p-7"><h2 className="text-lg font-semibold text-white mb-1">توقعك</h2><p className="text-sm text-mute mb-4">سجّل الدخول لتختم توقعك قبل البداية.</p>
    <a href="/login" className="btn inline-flex items-center px-6 rounded-xl bg-violet text-bg font-semibold">دخول لإختم توقعك</a></section></div>);
}
