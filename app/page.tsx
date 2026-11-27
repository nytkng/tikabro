import {getDay} from "@/lib/day";
import MatchRow from "@/components/MatchRow";
export const revalidate=60;
const sports=[["كرة القدم",true],["كرة السلة",true],["التنس",false],["كرة اليد",false],["الكرة الطائرة",false]] as const;
export default async function Home(){
  const date=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
  const ms=await getDay(date);
  const sample=ms.some(m=>m.sample);
  const elite=ms.filter(m=>m.probs).sort((a,b)=>Math.max(b.probs!.h,b.probs!.a)-Math.max(a.probs!.h,a.probs!.a))[0];
  return(<>
   <div className="flex flex-wrap gap-2 mb-6">{sports.map(([t,on],i)=><span key={t} className={`px-4 py-2.5 rounded-full text-sm ${i===0?"bg-violet text-bg font-semibold":"border border-line text-mute"}`}>{t}{!on&&" · قريبا"}</span>)}</div>
   {sample&&<div role="status" className="mb-5 rounded-xl border border-amber/40 bg-[#2A2110] text-amber text-sm px-4 py-3">مصدر البيانات غير متاح الآن، فهذه مباريات تجريبية للعرض فقط.</div>}
   {elite&&<section className="rounded-[20px] bg-surface border border-line p-7 mb-6"><div className="text-sm text-mute">اختيار اليوم الأقوى</div>
    <div className="text-3xl font-bold text-white mt-1">{elite.home} ضد {elite.away}</div>
    <p className="text-mute mt-2 leading-7">ثقة الـ AI {Math.max(elite.probs!.h,elite.probs!.a)}%. التوقع يُختم قبل البداية ولا يتبدل.</p></section>}
   <section className="rounded-[20px] bg-surface border border-line p-6"><h2 className="text-xl font-semibold text-white mb-2">مباريات اليوم</h2>
    {ms.map(m=><MatchRow key={m.id} m={m}/>)}</section></>);
}
