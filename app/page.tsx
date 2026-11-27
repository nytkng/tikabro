import TrustLine from "@/components/ledger/TrustLine";
import {getDay,isDate} from "@/lib/day";
import MatchRow from "@/components/MatchRow";
import VersusBar from "@/components/VersusBar";
import LiveRefresh from "@/components/LiveRefresh";
import Crest from "@/components/Crest";
import Countdown from "@/components/ui/Countdown";
import LiveTicker from "@/components/ui/LiveTicker";
import ProbRing from "@/components/ui/ProbRing";
import Seal from "@/components/ui/Seal";
import {pickOf} from "@/lib/model";
import {weekVersus} from "@/lib/versus";
import {db} from "@/lib/db";
import type {Match,Sport} from "@/lib/types";
import {getLang} from "@/lib/lang";
import {t,locOf,leagueOf,type Key,type Lang} from "@/lib/i18n";
export const dynamic="force-dynamic";
const sports:[Key,Sport,string][]=[["sp.football","football","⚽"],["sp.basketball","basketball","🏀"],["sp.hockey","hockey","🏒"],["sp.american","american","🏈"],["sp.baseball","baseball","⚾"],["sp.rugby","rugby","🏉"],["sp.volleyball","volleyball","🏐"],["sp.aussie","aussie","🏉"],["sp.lacrosse","lacrosse","🥍"],["sp.fieldhockey","fieldhockey","🏑"]];
const PRI=["alg.1","caf.champions","caf.confed","ksa.1","eng.1","esp.1","uefa.champions","ita.1","ger.1","fra.1","uefa.europa","uefa.europa.conf","mar.1","egy.1","tun.1","fifa.world","uefa.nations","por.1","ned.1","tur.1","bra.1","arg.1","usa.1","mex.1","eng.2","nba","nhl","nfl","mlb","wnba","180659","271937","270559","267979","270557","244293","college-football","mens-college-basketball"];
const rank=(s?:string)=>{const i=PRI.indexOf(s||"");return i<0?999:i};
const algDate=(off=0)=>new Date(Date.now()+off*864e5).toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
const wdLabel=(d:string,l:Lang)=>new Date(d+"T12:00:00Z").toLocaleDateString(locOf(l),{weekday:"long",timeZone:"UTC"});
const dmLabel=(d:string,l:Lang)=>new Date(d+"T12:00:00Z").toLocaleDateString(locOf(l),{day:"numeric",month:"long",timeZone:"UTC"});
type Lead={nick:string;n:number;hits:number;points:number};
export default async function Home({searchParams}:{searchParams:Promise<{s?:string;d?:string;l?:string;live?:string}>}){
  const sp=await searchParams;const lang=await getLang();
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
  for(const m of inSport){const k=m.slug&&m.slug!=="all"?m.slug:m.league;const x=lg.get(k)||{name:leagueOf(m,lang),logo:m.leagueLogo,n:0,live:0,slug:m.slug};x.n++;if(m.state==="live")x.live++;lg.set(k,x)}
  const leagues=[...lg.entries()].sort((a,b)=>rank(a[1].slug)-rank(b[1].slug)||b[1].n-a[1].n);
  const groups=new Map<string,Match[]>();for(const m of ms){const k=m.league||t(lang,"h.other");if(!groups.has(k))groups.set(k,[]);groups.get(k)!.push(m)}
  const ordered=[...groups.entries()].sort((a,b)=>(a[1].some(m=>m.state==="live")?0:1)-(b[1].some(m=>m.state==="live")?0:1)||rank(a[1][0].slug)-rank(b[1][0].slug)||b[1].length-a[1].length);
  const pre=inSport.filter(m=>m.probs&&m.state==="pre");
  const top=pre.sort((a,b)=>rank(a.slug)-rank(b.slug)||Math.max(b.probs!.h,b.probs!.a)-Math.max(a.probs!.h,a.probs!.a))[0]||inSport.find(m=>m.state==="live");
  const days=[-2,-1,0,1,2].map(o=>algDate(o));
  const q=(o:{s?:string;d?:string;l?:string;live?:string})=>{const p=new URLSearchParams();const s=o.s??cur,d=o.d??date;if(s!=="football")p.set("s",s);if(d!==today)p.set("d",d);if(o.l)p.set("l",o.l);if(o.live)p.set("live","1");const t=p.toString();return t?`/?${t}`:"/"};
  const tm=(iso:string)=>new Date(iso).toLocaleTimeString(locOf(lang),{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
  const liveList=inSport.filter(m=>m.state==="live").sort((a,b)=>rank(a.slug)-rank(b.slug));
  const st={live:ms.filter(m=>m.state==="live").length,pre:ms.filter(m=>m.state==="pre").length,post:ms.filter(m=>m.state==="post").length};
  const tp=top?.probs,tpk=tp?pickOf(tp):null,tlabel=tpk==="h"?top!.home:tpk==="a"?top!.away:t(lang,"draw");
  const medals=["#FFB020","#C8CEDD","#C98A55"];
  return(<>
   <LiveRefresh on={liveAll>0}/>
   <TrustLine lang={lang}/>
   <span hidden data-live-count={liveAll}/>
   {/* الرياضات */}
   <nav aria-label={t(lang,"h.sports")} className="flex gap-2 mb-4 overflow-x-auto scroll-x -mx-3 px-3 sm:mx-0 sm:px-0">{[...sports.map(([tk,k,ic])=><a key={k} href={q({s:k})} aria-current={k===cur?"page":undefined} className={"sport-pill "+(k===cur?"on":"")}><span aria-hidden className="text-base">{ic}</span>{t(lang,tk)}<span className="cnt tabular-nums">{counts.get(k)||0}</span></a>),...([[t(lang,"sp.tennis"),"tennis","🎾"],[t(lang,"sp.golf"),"golf","⛳"],[t(lang,"sp.f1"),"f1","🏎️"],["UFC","ufc","🥊"],["سباقات السيارات","racing","🏁"]] as const).map(([tt,k,ic])=><a key={k} href={`/individual/${k}`} className="sport-pill"><span aria-hidden className="text-base">{ic}</span>{tt}</a>)]}</nav>
   {sample&&<div role="status" className="mb-4 rounded-xl border border-amber/40 bg-[#2A2110] text-amber text-sm px-4 py-3">{t(lang,"h.sample")}</div>}
   <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
    {/* العمود الأيمن: الدوريات */}
    <aside className="hidden lg:block" aria-label={t(lang,"h.leagues")}>
     <div className="panel p-2 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scroll-x">
      <a href={q({})} className={"side-link justify-between "+(!sp.l&&!sp.live?"on":"")}>{t(lang,"h.all_leagues")}<span className="text-xs text-mute tabular-nums">{inSport.length}</span></a>
      {liveAll>0&&<a href={q({live:"1"})} className={"side-link justify-between !text-pink "+(sp.live?"on":"")}><span className="flex items-center gap-2"><i className="live-dot !mb-0"/>{t(lang,"live_now")}</span><span className="text-xs tabular-nums">{liveAll}</span></a>}
      <div className="h-px bg-line my-2"/>
      {leagues.map(([k,x])=><a key={k} href={q({l:k})} className={"side-link "+(sp.l===k?"on":"")}>
        {x.logo?<img src={x.logo} alt="" width={20} height={20} loading="lazy" referrerPolicy="no-referrer" className="w-5 h-5 object-contain shrink-0"/>:<span className="w-5 h-5 rounded bg-line shrink-0"/>}
        <span className="flex-1 truncate">{x.name}</span>{x.live>0?<i className="live-dot !mb-0"/>:<span className="text-[11px] text-mute tabular-nums">{x.n}</span>}</a>)}
     </div>
    </aside>
    {/* الوسط */}
    <section className="min-w-0" aria-label={t(lang,"h.matches")}>
     {/* المسرح: مباراة اليوم */}
     {top&&!sp.l&&!sp.live&&<article className="stage relative rounded-[22px] p-4 sm:p-7 mb-5 overflow-hidden">
      <div className="relative flex items-center justify-between gap-3 text-xs text-[#C9CCE0]">
       <span className="flex items-center gap-2 min-w-0">{top.leagueLogo?<img src={top.leagueLogo} alt="" width={18} height={18} referrerPolicy="no-referrer" className="w-[18px] h-[18px] object-contain"/>:null}<span className="truncate">{leagueOf(top,lang)}</span></span>
       <span className={"shrink-0 rounded-full px-3 py-1 font-semibold "+(top.state==="live"?"bg-pink/15 text-pink":"bg-amber/15 text-amber")}>{top.state==="live"?t(lang,"live_now"):t(lang,"h.match_of_day")}</span>
      </div>
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4 mt-5">
       <div className="flex flex-col items-center gap-2.5 text-center min-w-0"><Crest name={top.home} size={72} logo={top.homeLogo}/><b className="text-white text-sm sm:text-base leading-6 line-clamp-2"><bdi>{top.home}</bdi></b>{top.homeRec&&<span className="text-[11px] text-mute tabular-nums">{fmtRec(top.homeRec,lang)}</span>}</div>
       <div className="text-center scoreboard px-3 sm:px-5 py-3 rounded-2xl">
        {top.score?<><div className="font-display text-[44px] sm:text-6xl leading-none text-white tabular-nums" dir="ltr">{top.score[0]}<span className="text-mute mx-1.5">:</span>{top.score[1]}</div>{top.state==="live"&&<div className="mt-2 inline-flex items-center gap-1.5 text-pink text-xs font-semibold"><i className="live-dot !mb-0"/>{top.clock||t(lang,"live")}</div>}</>
        :<><div className="font-display text-[34px] sm:text-5xl leading-none text-white tabular-nums">{tm(top.kickoff)}</div><div className="mt-2 text-[11px] text-mute">{t(lang,"h.kick_in")} <Countdown lang={lang} to={top.kickoff} className="text-amber font-semibold tabular-nums"/></div></>}
       </div>
       <div className="flex flex-col items-center gap-2.5 text-center min-w-0"><Crest name={top.away} size={72} logo={top.awayLogo}/><b className="text-white text-sm sm:text-base leading-6 line-clamp-2"><bdi>{top.away}</bdi></b>{top.awayRec&&<span className="text-[11px] text-mute tabular-nums">{fmtRec(top.awayRec,lang)}</span>}</div>
      </div>
      {tp&&tpk&&<div className="relative mt-6 flex items-center gap-4 rounded-2xl bg-[#090C16]/70 border border-white/5 p-3 sm:p-4">
       <ProbRing h={tp.h} d={tp.d} a={tp.a} size={84} label={tlabel} pct={tp[tpk]} lang={lang}/>
       <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#C9CCE0]">{t(lang,"h.ai_sealed")} <b className="text-white"><bdi>{tlabel}</bdi></b></p>
        <div className="flex h-2 rounded-full overflow-hidden gap-[3px] mt-2.5" aria-hidden><i style={{width:tp.h+"%"}} className="bg-violet"/>{tp.d>0&&<i style={{width:tp.d+"%"}} className="bg-[#4A5273]"/>}<i style={{width:tp.a+"%"}} className="bg-pink"/></div>
        <div className="flex justify-between text-[11px] text-mute mt-1.5 tabular-nums"><span>{tp.h}%</span>{tp.d>0&&<span>{t(lang,"draw")} <bdi dir="ltr">{tp.d}%</bdi></span>}<span>{tp.a}%</span></div>
        {vs&&<p className="text-[11px] text-mute mt-2">{t(lang,"h.week")} <b className="text-pink tabular-nums" dir="ltr">{vs.humans}%</b> {t(lang,"h.vs_machine")} <b className="text-violet tabular-nums" dir="ltr">{vs.ai}%</b>. {t(lang,"h.with_who")}</p>}
       </div>
      </div>}
      <div className="relative mt-5 flex items-center justify-center gap-3">
       <a href={`/match/${encodeURIComponent(top.id)}`} className="cta btn inline-flex items-center gap-2 h-12 px-7 rounded-2xl font-semibold text-[15px]">{top.state==="pre"?t(lang,"h.seal_pick"):t(lang,"h.follow")}<span aria-hidden>{lang==="ar"?"←":"→"}</span></a>
       {top.state==="pre"&&<Seal size={48} className="seal">{t(lang,"sealed")}</Seal>}
      </div>
     </article>}
     {/* شريط المباشر */}
     {liveList.length>0&&!sp.live&&<section className="mb-5" aria-labelledby="live-h">
      <div className="flex items-center justify-between mb-2.5"><h2 id="live-h" className="flex items-center gap-2 text-[15px] font-semibold text-white"><i className="live-dot !mb-0"/>{t(lang,"live_now")} <span className="text-mute text-xs font-normal tabular-nums">{liveList.length}</span></h2><a href={q({live:"1"})} className="text-xs text-violet hover:text-white min-h-11 inline-flex items-center">{t(lang,"h.all_live")}</a></div>
      <LiveTicker>{liveList.slice(0,12).map(m=><a role="listitem" key={m.id} href={`/match/${encodeURIComponent(m.id)}`} className="tick-card snap-start shrink-0 w-[236px] rounded-2xl p-3">
        <div className="flex items-center justify-between text-[11px] text-mute gap-2"><span className="truncate">{leagueOf(m,lang)}</span><span className="text-pink font-semibold tabular-nums shrink-0"><bdi dir="ltr">{m.clock||t(lang,"live")}</bdi></span></div>
        {[[m.home,m.homeLogo,m.score?.[0]],[m.away,m.awayLogo,m.score?.[1]]].map(([n,l,g],i)=><div key={i} className="flex items-center gap-2 mt-2"><Crest name={n as string} size={22} logo={l as string|null}/><span className="flex-1 truncate text-[13px] text-white"><bdi>{n as string}</bdi></span><b className="font-display text-xl leading-none text-white tabular-nums">{g as number??"-"}</b></div>)}
      </a>)}</LiveTicker>
     </section>}
     {/* شريط الأيام */}
     <nav aria-label={t(lang,"h.days")} className="panel flex items-center gap-1 p-1 mb-3 overflow-x-auto scroll-x">
      {days.map(d=><a key={d} href={q({d,l:sp.l})} aria-current={d===date?"date":undefined} className={"day-tab "+(d===date?"on":"")}>{d===today?t(lang,"h.today"):d===algDate(-1)?t(lang,"h.yesterday"):d===algDate(1)?t(lang,"h.tomorrow"):wdLabel(d,lang)}{" "}<span className="block text-[11px] opacity-70 tabular-nums">{dmLabel(d,lang)}</span></a>)}
     </nav>
     <p className="text-[11px] text-mute -mt-2 mb-3 px-1">{t(lang,"h.alg_time")}</p>
     {/* الدوريات على الهاتف */}
     <div className="lg:hidden flex gap-2 mb-3 overflow-x-auto scroll-x -mx-3 px-3">
      {liveAll>0&&<a href={q({live:"1"})} className={"chip !text-pink "+(sp.live?"on-pink":"")}><i className="live-dot !mb-0"/>{t(lang,"live")} <span className="tabular-nums">{liveAll}</span></a>}
      {leagues.slice(0,20).map(([k,x])=><a key={k} href={q({l:k})} className={"chip "+(sp.l===k?"on":"")}>{x.logo?<img src={x.logo} alt="" width={18} height={18} loading="lazy" referrerPolicy="no-referrer" className="w-[18px] h-[18px] object-contain"/>:null}<span className="max-w-[140px] truncate">{x.name}</span></a>)}
     </div>
     {ordered.length?<div className="flt">
      {/* فلتر سريع بلا جافاسكريبت */}
      <fieldset className="seg mb-3"><legend className="sr-only">{t(lang,"h.filter")}</legend>
       {([["all",t(lang,"h.f_all"),ms.length],["live",t(lang,"live"),st.live],["pre",t(lang,"h.f_pre"),st.pre],["post",t(lang,"final"),st.post]] as const).map(([k,lbl,n],i)=><span key={k} className="contents"><input type="radio" name="f" id={"f-"+k} defaultChecked={i===0} className="sr-only"/><label htmlFor={"f-"+k}>{lbl}<span className="tabular-nums">{n}</span></label></span>)}
      </fieldset>
      <div className="flex flex-col gap-3">{ordered.map(([name,list],gi)=><details key={name} open={gi<10} className="lgroup panel overflow-hidden">
       <summary className="lg-head flex items-center gap-2.5 ps-4 pe-2 h-12 cursor-pointer select-none">
        {list[0].leagueLogo?<img src={list[0].leagueLogo} alt="" width={22} height={22} loading="lazy" referrerPolicy="no-referrer" className="w-[22px] h-[22px] object-contain"/>:<span className="w-[22px] h-[22px] rounded bg-line"/>}
        <span className="flex-1 truncate text-[14px] font-semibold text-white">{leagueOf(list[0],lang)||name}</span>
        {list.some(m=>m.state==="live")&&<i className="live-dot !mb-0"/>}
        <span className="text-xs text-mute tabular-nums">{list.length}</span>
        <a href={list[0].slug&&list[0].slug!=="all"?`/league/${list[0].id.split("-")[0]}/${list[0].slug}`:q({l:name})} className="text-[11px] text-violet hover:text-white px-2 min-h-11 inline-flex items-center">{t(lang,"h.league")}</a>
        <span aria-hidden className="chev"/>
       </summary>
       <div className="p-1.5 flex flex-col">{list.map(m=><MatchRow key={m.id} m={m} lang={lang}/>)}</div>
       <p className="empty-note text-xs text-mute px-4 pb-3">{t(lang,"h.empty_filter")}</p>
      </details>)}</div>
     </div>
     :<p className="panel text-mute p-10 text-center leading-7">{t(lang,date===today?"h.none_today":"h.none_day")}</p>}
    </section>
    {/* العمود الأيسر */}
    <aside className="flex flex-col gap-4 lg:sticky lg:top-20 self-start" aria-label={t(lang,"h.competition")}>
     {vs&&<VersusBar v={vs} lang={lang}/>}
     <section className="panel p-5" aria-labelledby="ld-h">
      <div className="flex items-center justify-between mb-2"><h2 id="ld-h" className="text-[15px] font-semibold text-white">{t(lang,"h.top")}</h2><a href="/leaders" className="text-xs text-violet hover:text-white min-h-11 inline-flex items-center">{t(lang,"h.full_rank")}</a></div>
      {leaders&&leaders.length?<ol className="flex flex-col">{leaders.slice(0,5).map((x,i)=><li key={x.nick}>
        <a href={`/u/${encodeURIComponent(x.nick)}`} className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-hover min-h-11">
        {i<3?<span className="medal" style={{["--m" as string]:medals[i]}}>{i+1}</span>:<span className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold bg-line text-[#C9CCE0] tabular-nums">{i+1}</span>}
        <span className="flex-1 truncate text-sm text-white"><bdi>{x.nick}</bdi></span>
        <span className="text-xs text-mute tabular-nums" dir="ltr">{x.hits}/{x.n}</span><b className="text-sm text-amber tabular-nums w-10 text-end">{x.points}</b></a></li>)}</ol>
      :<p className="text-sm text-mute leading-7">{t(lang,"h.rank_empty")}</p>}
     </section>
     <section className="panel p-5" aria-labelledby="how-h">
      <h2 id="how-h" className="text-[15px] font-semibold text-white">{t(lang,"h.how")}</h2>
      <ol className="steps mt-4 flex flex-col gap-4 text-[13px] text-[#C9CCE0] leading-6">
       <li><b>1</b>{t(lang,"h.step1")}</li>
       <li><b>2</b>{t(lang,"h.step2")}</li>
       <li><b>3</b>{t(lang,"h.step3")}</li>
      </ol>
      <p className="text-[11px] text-mute mt-4">{t(lang,"h.how_note")}</p>
     </section>
     <a href="/groups" className="invite panel block p-5 relative overflow-hidden">
      <Seal size={54} className="absolute top-4 end-4 rotate-[-8deg]">{t(lang,"h.friends_seal")}</Seal>
      <h2 className="text-[15px] font-semibold text-white">{t(lang,"h.friends_t")}</h2>
      <p className="text-[13px] text-[#C9CCE0] mt-1.5 leading-6 max-w-[200px]">{t(lang,"h.friends_p")}</p>
      <span className="mt-4 inline-flex items-center h-11 px-5 rounded-xl bg-white text-[#0B0D14] text-sm font-semibold">{t(lang,"h.friends_cta")}</span>
     </a>
    </aside>
   </div>
  </>);
}

function fmtRec(r:string,lang:string){const a=r.split("-");if(a.length<2)return r;const [w,d,l]=a.length===3?a:[a[0],"",a[1]];
  const L=lang==="fr"?["V","N","D"]:lang==="en"?["W","D","L"]:["ف","ت","خ"];
  return [w&&`${w}${L[0]}`,d&&`${d}${L[1]}`,l&&`${l}${L[2]}`].filter(Boolean).join(" · ")}
