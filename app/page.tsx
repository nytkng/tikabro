import {getDay} from "@/lib/day";
import MatchRow from "@/components/MatchRow";
import VersusBar from "@/components/VersusBar";
import {weekVersus} from "@/lib/versus";
const sports=[["كرة القدم","football",true],["كرة السلة","basketball",true],["التنس","tennis",false],["كرة اليد","handball",false],["الكرة الطائرة","volleyball",false]] as const;
export default async function Home({searchParams}:{searchParams:Promise<{s?:string}>}){
  const sp=(await searchParams).s;
  const cur=sports.find(x=>x[1]===sp&&x[2])?.[1]??"football";
  const date=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
  const [all,vs]=await Promise.all([getDay(date),weekVersus().catch(()=>null)]);
  const ms=all.filter(m=>m.sport===cur||m.sample);
  const sample=all.some(m=>m.sample);
  const elite=ms.filter(m=>m.probs).sort((a,b)=>Math.max(b.probs!.h,b.probs!.a)-Math.max(a.probs!.h,a.probs!.a))[0];
  return(<>
   <div className="flex flex-wrap gap-2 mb-6">{sports.map(([t,k,on])=>on?<a key={k} href={`/?s=${k}`} className={`px-4 py-2.5 rounded-full text-sm ${k===cur?"bg-violet text-bg font-semibold":"border border-line text-[#C9CCE0] hover:text-white"}`}>{t}</a>:<span key={k} className="px-4 py-2.5 rounded-full text-sm border border-line text-mute/60">{t} · قريبا</span>)}</div>
   {sample&&<div role="status" className="mb-5 rounded-xl border border-amber/40 bg-[#2A2110] text-amber text-sm px-4 py-3">مصدر البيانات غير متاح الآن، فهذه مباريات تجريبية للعرض فقط.</div>}
   <VersusBar v={vs}/>
   {elite&&<section className="rounded-[20px] bg-surface border border-line p-7 mb-6"><div className="text-sm text-mute">اختيار اليوم الأقوى</div>
    <div className="text-3xl font-bold text-white mt-1">{elite.home} ضد {elite.away}</div>
    <p className="text-mute mt-2 leading-7">احتمال الـ AI {Math.max(elite.probs!.h,elite.probs!.a)}%. التوقع يُختم قبل البداية ولا يتبدل.</p></section>}
   <section className="rounded-[20px] bg-surface border border-line p-6"><h2 className="text-xl font-semibold text-white mb-1">مباريات اليوم</h2>
    <div className="flex flex-wrap gap-4 text-xs text-mute mb-2"><span><i className="inline-block w-2.5 h-2.5 rounded-full bg-violet align-middle ms-1"/>فوز الأرض</span>{cur==="football"&&<span><i className="inline-block w-2.5 h-2.5 rounded-full bg-[#4A5273] align-middle ms-1"/>تعادل</span>}<span><i className="inline-block w-2.5 h-2.5 rounded-full bg-pink align-middle ms-1"/>فوز الضيف</span></div>
    {ms.length?ms.map(m=><MatchRow key={m.id} m={m}/>):<p className="text-mute py-6">ما كاين حتى ماتش اليوم في هذه الرياضة.</p>}</section></>);
}
