import {getDay} from "@/lib/day";
import {matchFromDB,teamIds} from "@/lib/feed";
import {goalsMap} from "@/lib/espn";
import {predictDCFull} from "@/lib/model";
import LiveRefresh from "@/components/LiveRefresh";
export const dynamic="force-dynamic";
import Crest from "@/components/Crest";
import {pickOf} from "@/lib/model";
import {currentPlayer} from "@/lib/auth";
import {db} from "@/lib/db";
import Markets from "@/components/Markets";
import MatchCentre from "@/components/MatchCentre";
import Comments from "@/components/Comments";
import PickButtons from "@/components/PickButtons";
import CrowdVsAI from "@/components/CrowdVsAI";
import ShareCard from "@/components/ShareCard";
import WhyCard from "@/components/WhyCard";
import {sha256} from "@/lib/auth";
import {headers} from "next/headers";
import ProbRing from "@/components/ui/ProbRing";
import Seal from "@/components/ui/Seal";
import Countdown from "@/components/ui/Countdown";
import StickyScore from "./StickyScore";
import JsonLd from "@/components/JsonLd";
import {matchMeta,sportsEventLd,SITE_URL} from "@/lib/seo";
import type {Metadata} from "next";
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
  const key=decodeURIComponent((await params).id);const eid=key.split(":")[1]||"";
  const m=/^\d{3,12}$/.test(eid)?await matchFromDB(eid).catch(()=>null):null;
  if(!m)return {metadataBase:new URL(SITE_URL),title:{absolute:"توقع مباراة | هدف"},robots:{index:false}};
  return {metadataBase:new URL(SITE_URL),...matchMeta(m)};
}
export default async function MatchPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const key=decodeURIComponent(id);
  const date=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
  const eid0=key.split(":")[1]||"";
  let m=/^\d{3,12}$/.test(eid0)?await matchFromDB(eid0).catch(()=>null):null;
  if(!m)m=(await getDay(date)).find(x=>x.id===key)??null;
  // الدوريات اللي عندها جدول ترتيب: Dixon-Coles كامل مع الأسواق
  if(m&&m.sport==="football"&&!m.ext&&m.slug&&m.slug!=="all"){try{const gm=await goalsMap("soccer/"+m.slug);
    if(gm){const raw=await teamIds(eid0);const hg=raw&&gm.map.get(raw.h),ag=raw&&gm.map.get(raw.a);
      if(hg&&ag&&hg.gp>=3&&ag.gp>=3){const f=predictDCFull(hg,ag,{avg:gm.avg});m={...m,probs:f.p,ext:f.ext}}}}catch{}}
  if(!m)return <div className="text-mute py-20 text-center">المباراة غير موجودة اليوم. <a className="underline" href="/">ارجع للأرينا</a></div>;
  const p=m.probs;const pk=p?pickOf(p):null;
  const me=await currentPlayer();
  const eid=key.split(":")[1];
  const mine=me&&!m.sample?(await db<{pick:"home"|"draw"|"away"}[]>(`picks?player_id=eq.${me.id}&match_id=eq.${eid}&select=pick&limit=1`))?.[0]?.pick??null:null;
  const open=m.state==="pre"&&!m.sample;
  const sealRow=m.sample?null:(await db<{p_home:number;p_draw:number|null;p_away:number;model_version:string;created_at:string}[]>(`predictions?match_id=eq.${eid}&select=p_home,p_draw,p_away,model_version,created_at&limit=1`))?.[0]??null;
  const sc=(x:number)=>Math.round(x<=1?x*100:x);
  const pp=sealRow&&m.sport==="football"?{h:sc(sealRow.p_home),d:sc(sealRow.p_draw??0),a:100-sc(sealRow.p_home)-sc(sealRow.p_draw??0)}:p;
  const pk2=pp?pickOf(pp):null;
  const sealed=!!sealRow;
  const sealText=sealRow?`${eid}|${sealRow.p_home}|${sealRow.p_draw??""}|${sealRow.p_away}|${sealRow.model_version}|${sealRow.created_at}`:"";
  const sealHash=sealRow?await sha256(sealText):"";
  const host=(await headers()).get("host")||"";const url=`https://${host}/match/${encodeURIComponent(key)}`;
  type K="home"|"draw"|"away";
  const rows=m.sample?null:await db<{pick:K}[]>(`picks?match_id=eq.${eid}&void=not.is.true&select=pick&limit=10000`);
  const counts:Record<K,number>={home:0,draw:0,away:0};for(const r of rows||[])if(r.pick in counts)counts[r.pick]++;
  const aiK:K|null=pk2==="h"?"home":pk2==="a"?"away":pk2==="d"?"draw":null;
  const outcome:K|null=m.state==="post"&&m.score?(m.score[0]>m.score[1]?"home":m.score[0]<m.score[1]?"away":"draw"):null;
  const live=m.state==="live",post=m.state==="post";
  const hasDraw=["football","rugby","aussie"].includes(m.sport);
  const kt=new Date(m.kickoff).toLocaleTimeString("ar-DZ",{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
  const kd=new Date(m.kickoff).toLocaleDateString("ar-DZ",{weekday:"long",day:"numeric",month:"long",timeZone:"Africa/Algiers"});
  const win=(i:0|1)=>post&&m.score?(i===0?m.score[0]>m.score[1]:m.score[1]>m.score[0]):false;
  const aiLabel=pk2==="h"?`فوز ${m.home}`:pk2==="a"?`فوز ${m.away}`:"تعادل";
  const aiPct=pp&&pk2?pp[pk2]:0;
  const side=(i:0|1)=>{const n=i?m.away:m.home,l=i?m.awayLogo:m.homeLogo;return(<div className="flex flex-col items-center gap-2.5 min-w-0 text-center">
    <span className={"rounded-full p-1 "+(win(i)?"ring-2 ring-amber/70 shadow-[0_0_30px_-6px_var(--glow-amber)]":"")}><Crest name={n} size={72} logo={l}/></span>
    <span className={"text-[15px] sm:text-lg font-semibold leading-6 line-clamp-2 "+(post&&!win(i)?"text-mute":"text-white")}><bdi>{n}</bdi></span>
    <span className="text-[11px] text-mute">{i?"الضيف":"صاحب الأرض"}</span></div>)};
  const H2=({c,children}:{c:string;children:React.ReactNode})=><h2 className="font-display text-xl text-white mb-1 flex items-center gap-2"><i aria-hidden className={"w-1.5 h-5 rounded-full "+c}/>{children}</h2>;
  return(<div className="flex flex-col gap-5 pb-6">
    <JsonLd data={sportsEventLd(m)}/>
   <LiveRefresh on={live} every={45}/>
   <StickyScore><div className="flex items-center gap-2 px-3 h-12 text-[13px]">
     <Crest name={m.home} size={22} logo={m.homeLogo}/><bdi className="truncate flex-1 text-white">{m.home}</bdi>
     <b dir="ltr" className={"scoreboard rounded-md px-2.5 leading-7 font-display text-base tabular-nums "+(live?"text-pink":"text-white")}>{m.score?`${m.score[0]} - ${m.score[1]}`:kt}</b>
     <bdi className="truncate flex-1 text-white text-end">{m.away}</bdi><Crest name={m.away} size={22} logo={m.awayLogo}/></div></StickyScore>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <a href={m.slug&&m.slug!=="all"?`/league/${key.split("-")[0]}/${m.slug}`:"/"} className="chip hover:text-white">{m.leagueLogo?<img src={m.leagueLogo} alt="" width={18} height={18} referrerPolicy="no-referrer" className="w-[18px] h-[18px] object-contain"/>:null}<bdi className="truncate max-w-[190px]">{m.league}</bdi></a>
    {!m.sample&&<a href={`/live/${encodeURIComponent(key)}`} className="chip !border-amber/50 !text-amber hover:bg-amber/10">🔴 وضع اللايف للبث في TikTok</a>}
   </div>
   <section id="stage" className="stage relative overflow-hidden rounded-[22px] px-4 pt-6 pb-5 sm:p-8">
    <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-3">
     {side(0)}
     <div className="flex flex-col items-center gap-2 pt-3">
      <div className="scoreboard rounded-xl px-4 py-2 min-w-[112px] text-center">
       {m.score?<b dir="ltr" className={"font-display text-[40px] leading-none tabular-nums "+(live?"text-pink":"text-white")}>{m.score[0]}<span className="text-mute mx-1.5">:</span>{m.score[1]}</b>
       :<b className="font-display text-[34px] leading-none text-white tabular-nums">{kt}</b>}
      </div>
      {live?<span className="inline-flex items-center gap-2 text-pink text-sm font-semibold"><i className="live-dot !mb-0"/>{m.clock&&m.clock!=="0'"?<bdi dir="ltr">{m.clock}</bdi>:"مباشر"}</span>
      :post?<span className="text-xs text-mute rounded-full bg-white/5 px-3 py-1">انتهت</span>
      :<><span className="text-[11px] text-mute text-center">{kd}</span><Countdown to={m.kickoff} className="text-amber text-sm font-semibold tabular-nums"/></>}
     </div>
     {side(1)}
    </div>
   </section>
   {pp?<section className="panel relative overflow-hidden p-5 sm:p-6">
     <div className="flex items-center gap-4">
      <ProbRing h={pp.h} d={pp.d} a={pp.a} size={104} label={aiLabel} pct={aiPct}/>
      <div className="flex-1 min-w-0"><div className="text-xs text-mute">{sealed?"توقع الـ AI المختوم":"تقدير الـ AI الآن، يتختم قبل البداية"}</div>
       <div className="font-display text-2xl sm:text-3xl text-white mt-1 leading-tight"><bdi>{aiLabel}</bdi></div></div>
      <Seal size={64} className={"seal shrink-0 "+(sealed?"":"opacity-40")}>{sealed?<>مختوم<br/><span className="text-[9px] font-sans">قبل الصافرة</span></>:"مازال"}</Seal>
     </div>
     <div className="flex h-2.5 rounded-full overflow-hidden gap-[3px] mt-5" aria-hidden><i style={{width:pp.h+"%"}} className="bg-violet"/>{pp.d>0&&<i style={{width:pp.d+"%"}} className="bg-[#4A5273]"/>}<i style={{width:pp.a+"%"}} className="bg-pink"/></div>
     <div className="grid grid-cols-3 text-xs mt-2 text-[#C9CCE0]"><span className="truncate"><bdi>{m.home}</bdi> <b dir="ltr" className="text-white">{pp.h}%</b></span><span className="text-center">{pp.d>0&&<>تعادل <b dir="ltr" className="text-white">{pp.d}%</b></>}</span><span className="truncate text-end"><bdi>{m.away}</bdi> <b dir="ltr" className="text-white">{pp.a}%</b></span></div>
     {sealed&&<details className="mt-4 text-xs text-mute"><summary className="cursor-pointer min-h-[44px] flex items-center">بصمة الختم (تحقق بنفسك)</summary>
       <p className="mt-1 leading-6">تختم في <bdi dir="ltr">{new Date(sealRow!.created_at).toLocaleString("ar-DZ",{timeZone:"Africa/Algiers"})}</bdi>. أي تبديل من بعد يبدّل البصمة كاملة. احسب SHA-256 تاع هذا النص وقارن:</p>
       <code dir="ltr" className="block mt-2 break-all rounded-lg bg-bg border border-line p-2 text-[#C9CCE0]">{sealText}</code>
       <code dir="ltr" className="block mt-2 break-all rounded-lg bg-bg border border-amber/40 p-2 text-amber">{sealHash}</code></details>}
     </section>
   :<section className="panel p-5 text-mute text-sm leading-7">ما كاينش توقع لهذي المباراة، البيانات ما تكفيش. ما نخمّنوش.</section>}
   <section className="panel p-5 sm:p-6"><H2 c="bg-violet">توقعك</H2>
    {m.sample?<p className="text-sm text-mute">مباراة تجريبية، ما فيهاش ختم.</p>
    :!open?<p className="text-sm text-mute leading-7">{mine?<>توقعك المختوم: <b className="text-white"><bdi>{mine==="home"?"فوز "+m.home:mine==="away"?"فوز "+m.away:"تعادل"}</bdi></b>. </>:""}التوقعات تسكّرت، المباراة بدات.</p>
    :me?<><p className="text-sm text-mute mb-4 leading-7">اختار قبل البداية. يتختم باسمك <b className="text-white"><bdi>{me.nick}</bdi></b> وتقدر تبدّلو حتى للصافرة.</p><PickButtons matchId={key} home={m.home} away={m.away} hasDraw={hasDraw} current={mine}/>
      {mine&&<div className="mt-4"><ShareCard nick={me.nick} home={m.home} away={m.away} mine={mine==="home"?`فوز ${m.home}`:mine==="away"?`فوز ${m.away}`:"تعادل"} ai={aiK==="home"?`فوز ${m.home}`:aiK==="away"?`فوز ${m.away}`:aiK==="draw"?"تعادل":null} aiPct={pp?(aiK==="home"?pp.h:aiK==="away"?pp.a:pp.d):null} kickoff={m.kickoff} url={url}/></div>}</>
    :<><p className="text-sm text-mute mb-4">ادخل لحسابك باش تختم توقعك قبل البداية.</p><a href="/login" className="btn cta inline-flex items-center px-6 rounded-xl font-semibold">ادخل واختم توقعك</a></>}
   </section>
   {!m.sample&&<CrowdVsAI home={m.home} away={m.away} hasDraw={hasDraw} counts={counts} ai={aiK} mine={mine} revealed={!!mine||!open} outcome={outcome}/>}
   {!m.sample&&<WhyCard m={m} sportPath={key.split("-")[0]} eid={eid}/>}
   {!m.sample&&<MatchCentre id={key}/>}
   {!m.sample&&<Comments matchId={eid}/>}
   {m.ext&&<Markets x={m.ext} home={m.home} away={m.away}/>}
  </div>);
}
