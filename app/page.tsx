import {getDay,isDate} from "@/lib/day";
import MatchRow from "@/components/MatchRow";
import VersusBar from "@/components/VersusBar";
import LiveRefresh from "@/components/LiveRefresh";
import {weekVersus} from "@/lib/versus";
import type {Match,Sport} from "@/lib/types";
export const dynamic="force-dynamic";
const sports:[string,Sport,boolean][]=[["كرة القدم","football",true],["كرة السلة","basketball",true],["الهوكي","hockey",true],["كرة القدم الأمريكية","american",true],["البيسبول","baseball",true],["التنس","tennis",false],["كرة اليد","handball",false]];
// ترتيب الدوريات: الأقرب لجمهورنا أولا
const PRI=["alg.1","caf.champions","caf.confed","ksa.1","eng.1","esp.1","uefa.champions","ita.1","ger.1","fra.1","uefa.europa","uefa.europa.conf","mar.1","egy.1","tun.1","fifa.world","uefa.nations","por.1","ned.1","tur.1","bra.1","arg.1","usa.1","mex.1","eng.2","nba","nhl","nfl","mlb","wnba"];
const rank=(s?:string)=>{const i=PRI.indexOf(s||"");return i<0?999:i};
const algDate=(off=0)=>new Date(Date.now()+off*864e5).toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
export default async function Home({searchParams}:{searchParams:Promise<{s?:string;d?:string}>}){
  const sp=await searchParams;
  const cur=sports.find(x=>x[1]===sp.s&&x[2])?.[1]??"football";
  const today=algDate(0);const date=sp.d&&isDate(sp.d)?sp.d:today;
  const [all,vs]=await Promise.all([getDay(date),weekVersus().catch(()=>null)]);
  const sample=all.some(m=>m.sample);
  const ms=all.filter(m=>m.sport===cur||m.sample);
  const live=ms.filter(m=>m.state==="live").length;
  const counts=new Map<string,number>();for(const m of all)counts.set(m.sport,(counts.get(m.sport)||0)+1);
  // تجميع حسب الدوري
  const groups=new Map<string,Match[]>();for(const m of ms){const k=m.league||"أخرى";if(!groups.has(k))groups.set(k,[]);groups.get(k)!.push(m)}
  const ordered=[...groups.entries()].sort((a,b)=>{
    const la=a[1].some(m=>m.state==="live")?0:1,lb=b[1].some(m=>m.state==="live")?0:1;
    return la-lb||rank(a[1][0].slug)-rank(b[1][0].slug)||b[1].length-a[1].length});
  const elite=ms.filter(m=>m.probs&&m.state==="pre").sort((a,b)=>Math.max(b.probs!.h,b.probs!.a)-Math.max(a.probs!.h,a.probs!.a))[0];
  const days:[string,string][]=[[algDate(-1),"أمس"],[today,"اليوم"],[algDate(1),"غدا"]];
  const q=(s:string,d:string)=>`/?s=${s}${d!==today?`&d=${d}`:""}`;
  return(<>
   <LiveRefresh on={live>0}/>
   <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
    <div className="flex gap-1 p-1 rounded-xl bg-surface border border-line">{days.map(([d,t])=><a key={d} href={q(cur,d)} className={"px-4 py-2 rounded-lg text-sm "+(d===date?"bg-violet text-bg font-semibold":"text-[#C9CCE0] hover:text-white")}>{t}</a>)}</div>
    {live>0&&<span className="inline-flex items-center gap-2 text-sm text-pink font-semibold"><i className="live-dot !mb-0"/>{live} مباشر الآن</span>}
   </div>
   <div className="flex gap-2 mb-6 overflow-x-auto pb-1">{sports.map(([t,k,on])=>on?<a key={k} href={q(k,date)} className={`shrink-0 px-4 py-2.5 rounded-full text-sm ${k===cur?"bg-white text-bg font-semibold":"border border-line text-[#C9CCE0] hover:text-white"}`}>{t}{counts.get(k)?<span className={"ms-1.5 text-xs "+(k===cur?"text-bg/60":"text-mute")}>{counts.get(k)}</span>:null}</a>:<span key={k} className="shrink-0 px-4 py-2.5 rounded-full text-sm border border-line text-mute/60">{t} · قريبا</span>)}</div>
   {sample&&<div role="status" className="mb-5 rounded-xl border border-amber/40 bg-[#2A2110] text-amber text-sm px-4 py-3">مصدر البيانات غير متاح الآن، فهذه مباريات تجريبية للعرض فقط.</div>}
   {date===today&&<VersusBar v={vs}/>}
   {elite&&<a href={`/match/${encodeURIComponent(elite.id)}`} className="block rounded-[20px] bg-surface border border-line p-6 mb-6 hover:border-violet/50">
    <div className="text-sm text-mute">أوضح توقع للـ AI {date===today?"اليوم":""}</div>
    <div className="flex items-center gap-3 mt-3 flex-wrap">
     <span className="flex items-center gap-2 text-xl font-bold text-white"><Logo src={elite.homeLogo}/>{elite.home}</span><span className="text-mute">ضد</span><span className="flex items-center gap-2 text-xl font-bold text-white"><Logo src={elite.awayLogo}/>{elite.away}</span></div>
    <p className="text-mute mt-2 text-sm">{elite.league} · الـ AI يعطي <b className="text-white" dir="ltr">{Math.max(elite.probs!.h,elite.probs!.a)}%</b>. اختم توقعك قبل البداية.</p></a>}
   {ordered.length?<div className="flex flex-col gap-4">{ordered.map(([name,list])=><section key={name} className="rounded-[20px] bg-surface border border-line px-4 py-3">
     <h2 className="flex items-center gap-2.5 py-2 text-[15px] font-semibold text-white">{list[0].leagueLogo?<img src={list[0].leagueLogo} alt="" width={22} height={22} loading="lazy" referrerPolicy="no-referrer" className="w-[22px] h-[22px] object-contain"/>:null}{name}<span className="text-xs text-mute font-normal">{list.length}</span></h2>
     {list.map(m=><MatchRow key={m.id} m={m}/>)}</section>)}</div>
   :<p className="rounded-[20px] bg-surface border border-line text-mute p-8 text-center">ما كاين حتى ماتش في هذه الرياضة {date===today?"اليوم":"في هذا اليوم"}.</p>}
  </>);
}
function Logo({src}:{src?:string|null}){return src?<img src={src} alt="" width={28} height={28} loading="lazy" referrerPolicy="no-referrer" className="w-7 h-7 object-contain"/>:null}
