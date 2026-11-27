import {getDay,isDate} from "@/lib/day";
import MatchRow from "@/components/MatchRow";
import VersusBar from "@/components/VersusBar";
import LiveRefresh from "@/components/LiveRefresh";
import Crest from "@/components/Crest";
import {weekVersus} from "@/lib/versus";
import {db} from "@/lib/db";
import type {Match,Sport} from "@/lib/types";
export const dynamic="force-dynamic";
const sports:[string,Sport,string][]=[["كرة القدم","football","⚽"],["كرة السلة","basketball","🏀"],["الهوكي","hockey","🏒"],["كرة القدم الأمريكية","american","🏈"],["البيسبول","baseball","⚾"],["الركبي","rugby","🏉"],["الكرة الطائرة","volleyball","🏐"],["الكرة الأسترالية","aussie","🏉"]];
const PRI=["alg.1","caf.champions","caf.confed","ksa.1","eng.1","esp.1","uefa.champions","ita.1","ger.1","fra.1","uefa.europa","uefa.europa.conf","mar.1","egy.1","tun.1","fifa.world","uefa.nations","por.1","ned.1","tur.1","bra.1","arg.1","usa.1","mex.1","eng.2","nba","nhl","nfl","mlb","wnba","180659","271937","270559","267979","270557","244293","college-football","mens-college-basketball"];
const rank=(s?:string)=>{const i=PRI.indexOf(s||"");return i<0?999:i};
const algDate=(off=0)=>new Date(Date.now()+off*864e5).toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
const dayLabel=(d:string)=>new Date(d+"T12:00:00Z").toLocaleDateString("ar-DZ",{weekday:"short",day:"numeric",month:"short"});
type Lead={nick:string;n:number;hits:number;points:number};
export default async function Home({searchParams}:{searchParams:Promise<{s?:string;d?:string;l?:string;live?:string}>}){
  const sp=await searchParams;
  const cur=sports.find(x=>x[1]===sp.s)?.[1]??"football";
  const today=algDate(0);const date=sp.d&&isDate(sp.d)?sp.d:today;
  const since=new Date(Date.now()-7*864e5).toISOString();
  const [all,vs,leaders]=await Promise.all([getDay(date),date===today?weekVersus().catch(()=>null):Promise.resolve(null),
    db<Lead[]>("rpc/leaderboard",{method:"POST",body:JSON.stringify({p_since:since,p_min:1,p_days:1,p_age:"0 seconds"})}).catch(()=>null)]);
  const sample=all.some(m=>m.sample);
  const inSport=all.filter(m=>m.sport===cur||m.sample);
  const liveAll=inSport.filter(m=>m.state==="live").length;
  let ms=inSport;if(sp.l)ms=ms.filter(m=>(m.slug||m.league)===sp.l);if(sp.live)ms=ms.filter(m=>m.state==="live");
  const counts=new Map<string,number>();for(const m of all)counts.set(m.sport,(counts.get(m.sport)||0)+1);
  // الدوريات المتاحة في هذا اليوم
  const lg=new Map<string,{name:string;logo?:string|null;n:number;live:number;slug?:string}>();
  for(const m of inSport){const k=m.slug&&m.slug!=="all"?m.slug:m.league;const x=lg.get(k)||{name:m.league,logo:m.leagueLogo,n:0,live:0,slug:m.slug};x.n++;if(m.state==="live")x.live++;lg.set(k,x)}
  const leagues=[...lg.entries()].sort((a,b)=>rank(a[1].slug)-rank(b[1].slug)||b[1].n-a[1].n);
  const groups=new Map<string,Match[]>();for(const m of ms){const k=m.league||"أخرى";if(!groups.has(k))groups.set(k,[]);groups.get(k)!.push(m)}
  const ordered=[...groups.entries()].sort((a,b)=>(a[1].some(m=>m.state==="live")?0:1)-(b[1].some(m=>m.state==="live")?0:1)||rank(a[1][0].slug)-rank(b[1][0].slug)||b[1].length-a[1].length);
  const pre=inSport.filter(m=>m.probs&&m.state==="pre");
  const top=pre.sort((a,b)=>rank(a.slug)-rank(b.slug)||Math.max(b.probs!.h,b.probs!.a)-Math.max(a.probs!.h,a.probs!.a))[0]||inSport.find(m=>m.state==="live");
  const days=[-2,-1,0,1,2].map(o=>algDate(o));
  const q=(o:{s?:string;d?:string;l?:string;live?:string})=>{const p=new URLSearchParams();const s=o.s??cur,d=o.d??date;if(s!=="football")p.set("s",s);if(d!==today)p.set("d",d);if(o.l)p.set("l",o.l);if(o.live)p.set("live","1");const t=p.toString();return t?`/?${t}`:"/"};
  const card="rounded-2xl bg-card border border-line";
  return(<>
   <LiveRefresh on={liveAll>0}/>
   {/* الرياضات */}
   <div className="flex gap-2 mb-4 overflow-x-auto scroll-x">{sports.map(([t,k,ic])=><a key={k} href={q({s:k})} className={"shrink-0 flex items-center gap-2 h-11 px-4 rounded-xl text-sm border "+(k===cur?"bg-white !text-[#0B0D14] border-white font-semibold":"border-line text-[#C9CCE0] hover:text-white hover:bg-hover")}><span aria-hidden>{ic}</span>{t}<span className={"text-xs tabular-nums "+(k===cur?"!text-[#0B0D14]/50":"text-mute")}>{counts.get(k)||0}</span></a>)}</div>
   {sample&&<div role="status" className="mb-4 rounded-xl border border-amber/40 bg-[#2A2110] text-amber text-sm px-4 py-3">مصدر البيانات غير متاح الآن، فهذه مباريات تجريبية للعرض فقط.</div>}
   <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)_320px]">
    {/* العمود الأيمن: الدوريات */}
    <aside className="hidden lg:block">
     <div className={card+" p-2 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"}>
      <a href={q({})} className={"flex items-center justify-between px-3 h-10 rounded-lg text-sm "+(!sp.l&&!sp.live?"bg-hover text-white font-semibold":"text-[#C9CCE0] hover:bg-hover")}>كل الدوريات<span className="text-xs text-mute">{inSport.length}</span></a>
      {liveAll>0&&<a href={q({live:"1"})} className={"flex items-center justify-between px-3 h-10 rounded-lg text-sm "+(sp.live?"bg-hover text-white font-semibold":"text-pink hover:bg-hover")}><span className="flex items-center gap-2"><i className="live-dot !mb-0"/>مباشر الآن</span><span className="text-xs">{liveAll}</span></a>}
      <div className="h-px bg-line my-2"/>
      {leagues.map(([k,x])=><a key={k} href={q({l:k})} className={"flex items-center gap-2.5 px-3 h-10 rounded-lg text-[13px] "+(sp.l===k?"bg-hover text-white font-semibold":"text-[#C9CCE0] hover:bg-hover hover:text-white")}>
        {x.logo?<img src={x.logo} alt="" width={20} height={20} loading="lazy" referrerPolicy="no-referrer" className="w-5 h-5 object-contain shrink-0"/>:<span className="w-5 h-5 rounded bg-line shrink-0"/>}
        <span className="flex-1 truncate">{x.name}</span>{x.live>0?<i className="live-dot !mb-0"/>:<span className="text-[11px] text-mute tabular-nums">{x.n}</span>}</a>)}
     </div>
    </aside>
    {/* الوسط: المباريات */}
    <section className="min-w-0">
     <div className={card+" flex items-center gap-1 p-1 mb-4 overflow-x-auto scroll-x"}>
      {days.map(d=><a key={d} href={q({d,l:sp.l})} className={"flex-1 min-w-[72px] text-center rounded-xl py-2 text-sm leading-5 "+(d===date?"bg-violet !text-[#0B0D14] font-semibold":"text-[#C9CCE0] hover:bg-hover")}>{d===today?"اليوم":d===algDate(-1)?"أمس":d===algDate(1)?"غدا":dayLabel(d)}<span className={"block text-[11px] "+(d===date?"!text-[#0B0D14]/60":"text-mute")}>{dayLabel(d)}</span></a>)}
     </div>
     {/* الدوريات على الهاتف */}
     <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto scroll-x">
      {liveAll>0&&<a href={q({live:"1"})} className={"shrink-0 flex items-center gap-2 h-9 px-3 rounded-full text-sm border "+(sp.live?"border-pink text-pink":"border-line text-pink")}><i className="live-dot !mb-0"/>مباشر {liveAll}</a>}
      {leagues.slice(0,20).map(([k,x])=><a key={k} href={q({l:k})} className={"shrink-0 flex items-center gap-2 h-9 px-3 rounded-full text-[13px] border "+(sp.l===k?"bg-white !text-[#0B0D14] border-white":"border-line text-[#C9CCE0]")}>{x.logo?<img src={x.logo} alt="" width={18} height={18} loading="lazy" referrerPolicy="no-referrer" className="w-[18px] h-[18px] object-contain"/>:null}<span className="max-w-[140px] truncate">{x.name}</span></a>)}
     </div>
     {/* البانر: مباراة اليوم */}
     {top&&!sp.l&&!sp.live&&<a href={`/match/${encodeURIComponent(top.id)}`} className="pitch block rounded-2xl border border-line p-5 sm:p-7 mb-5 hover:border-violet/60">
      <div className="flex items-center justify-between text-xs text-[#C9CCE0]"><span className="flex items-center gap-2">{top.leagueLogo?<img src={top.leagueLogo} alt="" width={18} height={18} referrerPolicy="no-referrer" className="w-[18px] h-[18px] object-contain"/>:null}{top.league}</span>
       <span className="rounded-full bg-amber/15 text-amber px-3 py-1 font-semibold">{top.state==="live"?"مباشر الآن":"مباراة اليوم"}</span></div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-5">
       <div className="flex flex-col items-center gap-2 text-center min-w-0"><Crest name={top.home} size={64} logo={top.homeLogo}/><b className="text-white text-sm sm:text-base leading-6">{top.home}</b></div>
       <div className="text-center">{top.score?<div className="font-display text-5xl text-white tabular-nums">{top.score[0]}-{top.score[1]}</div>:<div className="font-display text-4xl text-white tabular-nums">{new Date(top.kickoff).toLocaleTimeString("ar-DZ",{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"})}</div>}</div>
       <div className="flex flex-col items-center gap-2 text-center min-w-0"><Crest name={top.away} size={64} logo={top.awayLogo}/><b className="text-white text-sm sm:text-base leading-6">{top.away}</b></div>
      </div>
      {top.probs&&<><div className="flex h-2 rounded-full overflow-hidden gap-[3px] mt-6"><i style={{width:top.probs.h+"%"}} className="bg-violet"/>{top.probs.d>0&&<i style={{width:top.probs.d+"%"}} className="bg-[#4A5273]"/>}<i style={{width:top.probs.a+"%"}} className="bg-pink"/></div>
       <div className="flex justify-between text-xs text-[#C9CCE0] mt-2 tabular-nums"><span>{top.probs.h}%</span>{top.probs.d>0&&<span>تعادل {top.probs.d}%</span>}<span>{top.probs.a}%</span></div></>}
      <div className="mt-5 text-center"><span className="inline-flex items-center h-11 px-6 rounded-xl bg-white !text-[#0B0D14] font-semibold text-sm">{top.state==="pre"?"اختم توقعك ضد الـ AI":"تابع المباراة"}</span></div>
     </a>}
     {ordered.length?<div className="flex flex-col gap-3">{ordered.map(([name,list])=><section key={name} className={card+" overflow-hidden"}>
       <a href={list[0].slug&&list[0].slug!=="all"?`/league/${list[0].id.split("-")[0]}/${list[0].slug}`:q({l:name})} className="flex items-center gap-2.5 px-4 h-12 bg-[#0E1220] border-b border-line text-[14px] font-semibold text-white hover:text-violet">
        {list[0].leagueLogo?<img src={list[0].leagueLogo} alt="" width={22} height={22} loading="lazy" referrerPolicy="no-referrer" className="w-[22px] h-[22px] object-contain"/>:null}<span className="flex-1 truncate">{name}</span><span className="text-xs text-mute font-normal">{list.length}</span></a>
       <div className="px-2">{list.map(m=><MatchRow key={m.id} m={m}/>)}</div></section>)}</div>
     :<p className={card+" text-mute p-10 text-center"}>ما كاين حتى ماتش هنا {date===today?"اليوم":"في هذا اليوم"}. جرّب يوم آخر ولا رياضة أخرى.</p>}
    </section>
    {/* العمود الأيسر */}
    <aside className="flex flex-col gap-4 lg:sticky lg:top-20 self-start">
     {vs&&<VersusBar v={vs}/>}
     <div className={card+" p-5"}>
      <div className="flex items-center justify-between mb-3"><h2 className="font-semibold text-white">أقوى المتوقعين</h2><a href="/leaders" className="text-xs text-violet">الكل</a></div>
      {leaders&&leaders.length?<ol className="flex flex-col">{leaders.slice(0,5).map((x,i)=><li key={x.nick} className="flex items-center gap-3 py-2.5 border-t border-line first:border-0">
        <span className={"w-7 h-7 rounded-full grid place-items-center text-xs font-bold "+(i===0?"bg-amber text-[#0B0D14]":"bg-line text-white")}>{i+1}</span>
        <a href={`/u/${encodeURIComponent(x.nick)}`} className="flex-1 truncate text-sm text-white hover:text-violet">{x.nick}</a>
        <span className="text-xs text-mute tabular-nums">{x.hits}/{x.n} · <b className="text-white">{x.points}</b></span></li>)}</ol>
      :<p className="text-sm text-mute leading-7">الترتيب يتعمّر كي تنتهي المباريات المختومة هذا الأسبوع. كن الأول.</p>}
     </div>
     <div className={card+" p-5"}>
      <h2 className="font-semibold text-white">كيفاش تلعب</h2>
      <ol className="mt-3 flex flex-col gap-3 text-sm text-[#C9CCE0] leading-6">
       <li className="flex gap-3"><b className="text-amber">1</b>اختار مباراة واختم توقعك قبل الصافرة.</li>
       <li className="flex gap-3"><b className="text-amber">2</b>الـ AI يختم توقعو تاني، وبصمتو تبان للكل.</li>
       <li className="flex gap-3"><b className="text-amber">3</b>كي تنتهي، تتحسب النقاط وتطلع النجوم في بروفايلك.</li>
      </ol>
      <p className="text-xs text-mute mt-4">للتوقعات فقط. بلا رهان، بلا دراهم.</p>
     </div>
    </aside>
   </div>
  </>);
}
