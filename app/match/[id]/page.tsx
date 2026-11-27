import {getDay} from "@/lib/day";
import {matchFromDB,teamIds} from "@/lib/feed";
import {goalsMap,rankMap} from "@/lib/espn";
import {predictDCFull} from "@/lib/model";
import {dbGoals} from "@/lib/goals";
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
import PostMortem from "@/components/PostMortem";
import FollowMatch from "@/components/FollowMatch";
import {sha256} from "@/lib/auth";
import {headers} from "next/headers";
import ProbRing from "@/components/ui/ProbRing";
import Seal from "@/components/ui/Seal";
import Countdown from "@/components/ui/Countdown";
import StickyScore from "./StickyScore";
import JsonLd from "@/components/JsonLd";
import {matchMeta,sportsEventLd,SITE_URL} from "@/lib/seo";
import type {Metadata} from "next";
import {getLang} from "@/lib/lang";
import {t,locOf,leagueOf,type Key} from "@/lib/i18n";
import {ProbTiles,Sparkline,Radar,PercentileBars,Momentum,FormBoxes} from "@/components/viz/Viz";
import {probHistory,teamViz} from "@/components/viz/data";
const TABS=["pred","stats","h2h","line"] as const;type Tab=typeof TABS[number];
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
  const key=decodeURIComponent((await params).id);const eid=key.split(":")[1]||"";
  const m=/^\d{3,12}$/.test(eid)?await matchFromDB(eid).catch(()=>null):null;
  if(!m)return {metadataBase:new URL(SITE_URL),title:{absolute:"توقع مباراة | هدف"},robots:{index:false}};
  return {metadataBase:new URL(SITE_URL),...matchMeta(m)};
}
export default async function MatchPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{tab?:string}>}){
  const {id}=await params;const tq=(await searchParams).tab;const tab:Tab=(TABS as readonly string[]).includes(tq||"")?tq as Tab:"pred";const key=decodeURIComponent(id);const lang=await getLang();const W=(x:string)=>t(lang,"win",{t:x}),DR=t(lang,"draw");
  const date=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
  const eid0=key.split(":")[1]||"";
  let m=/^\d{3,12}$/.test(eid0)?await matchFromDB(eid0).catch(()=>null):null;
  if(!m)m=(await getDay(date)).find(x=>x.id===key)??null;
  // الدوريات اللي عندها جدول ترتيب: Dixon-Coles كامل مع الأسواق
  if(m&&m.sport==="football"&&!m.ext){let done=false;
    if(m.slug&&m.slug!=="all"){try{const gm=await goalsMap("soccer/"+m.slug);
      if(gm){const raw=await teamIds(eid0);const hg=raw&&gm.map.get(raw.h),ag=raw&&gm.map.get(raw.a);
        if(hg&&ag&&hg.gp>=3&&ag.gp>=3){const f=predictDCFull(hg,ag,{avg:gm.avg});m={...m,probs:f.p,ext:f.ext};done=true}}}catch{}}
    // بلا جدول ترتيب: نفس النموذج من نتائجنا المخزنة
    if(!done){try{const g=await dbGoals(eid0,m.slug);if(g){const f=predictDCFull(g.h,g.a,{avg:g.avg});m={...m,probs:f.p,ext:f.ext}}}catch{}}}
  if(!m)return <div className="text-mute py-20 text-center">{t(lang,"m.notfound")} <a className="underline" href="/">{t(lang,"m.back")}</a></div>;
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
  const kt=new Date(m.kickoff).toLocaleTimeString(locOf(lang),{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
  const kd=new Date(m.kickoff).toLocaleDateString(locOf(lang),{weekday:"long",day:"numeric",month:"long",timeZone:"Africa/Algiers"});
  const win=(i:0|1)=>post&&m.score?(i===0?m.score[0]>m.score[1]:m.score[1]>m.score[0]):false;
  const aiLabel=pk2==="h"?W(m.home):pk2==="a"?W(m.away):DR;
  const aiPct=pp&&pk2?pp[pk2]:0;
  const sp=key.split("-")[0];const ids=m.sample?null:await teamIds(eid0).catch(()=>null);
  const [hist,viz]=await Promise.all([pk2&&!m.sample?probHistory(`${sp}:${eid0}`,pk2):null,ids&&(tab==="stats"||tab==="h2h")?teamViz(sp,ids,m,lang):null]);
  // الفورمة ضد الترتيب: فريق تحت في الجدول ربح ≥2 أكثر في آخر 5
  const wins=(f?:string|null)=>{const x=(f||"").toUpperCase().replace(/[^WDL]/g,"").slice(0,5);return x.length>=5?[...x].filter(c=>c==="W").length:null};
  const wh=wins(m.homeForm),wa=wins(m.awayForm);
  let diverge:string|null=null;
  if(wh!=null&&wa!=null&&Math.abs(wh-wa)>=2&&ids&&m.slug&&m.slug!=="all"&&m.sport==="football"&&!post){
    const rk=await rankMap("soccer/"+m.slug).catch(()=>null);const rh=rk?.get(String(ids.h)),ra=rk?.get(String(ids.a));
    if(rh&&ra&&rh!==ra){const low=rh>ra?0:1,lw=low?wa:wh,hw=low?wh:wa;
      if(lw-hw>=2)diverge=t(lang,"d2.diverge_txt",{t:low?m.away:m.home,r:low?ra:rh,w:lw,o:low?m.home:m.away,ow:hw})}}
  const tabHref=(x:Tab)=>`/match/${encodeURIComponent(key)}${x==="pred"?"":"?tab="+x}#tabs`;
  const side=(i:0|1)=>{const n=i?m.away:m.home,l=i?m.awayLogo:m.homeLogo;return(<div className="flex flex-col items-center gap-2.5 min-w-0 text-center">
    <span className={"rounded-full p-1 "+(win(i)?"ring-2 ring-win/70":"")}><Crest name={n} size={72} logo={l}/></span>
    {(()=>{const tid=i?ids?.a:ids?.h,cl="text-[15px] sm:text-lg font-semibold leading-6 line-clamp-2 "+(post&&!win(i)?"text-mute":"text-white");return tid?<a href={`/team/${sp}/${tid}`} className={cl+" hover:underline"}><bdi>{n}</bdi></a>:<span className={cl}><bdi>{n}</bdi></span>})()}
    <span className="text-[11px] text-mute">{t(lang,i?"away_side":"home_side")}</span>{!post&&<FormBoxes f={i?m.awayForm:m.homeForm} lang={lang} size="md"/>}</div>)};
  const H2=({c,children}:{c:string;children:React.ReactNode})=><h2 className="font-display text-xl text-white mb-1 flex items-center gap-2"><i aria-hidden className={"w-1.5 h-5 rounded-full "+c}/>{children}</h2>;
  return(<div className="flex flex-col gap-5 pb-6">
    <JsonLd data={sportsEventLd(m)}/>
   <LiveRefresh on={live} every={45}/>
   <StickyScore><div className="flex items-center gap-2 px-3 h-12 text-[13px]">
     <Crest name={m.home} size={22} logo={m.homeLogo}/><bdi className="truncate flex-1 text-white">{m.home}</bdi>
     <b dir="ltr" className={"scoreboard rounded-md px-2.5 leading-7 font-display text-base tabular-nums "+(live?"text-pink":"text-white")}>{m.score?`${m.score[0]} - ${m.score[1]}`:kt}</b>
     <bdi className="truncate flex-1 text-white text-end">{m.away}</bdi><Crest name={m.away} size={22} logo={m.awayLogo}/></div></StickyScore>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <a href={m.slug&&m.slug!=="all"?`/league/${key.split("-")[0]}/${m.slug}`:"/"} className="chip hover:text-white">{m.leagueLogo?<img src={m.leagueLogo} alt="" width={18} height={18} referrerPolicy="no-referrer" className="w-[18px] h-[18px] object-contain"/>:null}<bdi className="truncate max-w-[190px]">{leagueOf(m,lang)}</bdi></a>
    {!m.sample&&!post&&<FollowMatch id={eid} mkey={key} lang={lang}/>}
    {!m.sample&&<a href={`/live/${encodeURIComponent(key)}`} className="chip hover:text-white hover:bg-hover">{t(lang,"m.live_mode")}</a>}
   </div>
   <section id="stage" className="stage relative overflow-hidden rounded-[22px] px-4 pt-6 pb-5 sm:p-8">
    <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-3">
     {side(0)}
     <div className="flex flex-col items-center gap-2 pt-3">
      <div className="scoreboard rounded-xl px-4 py-2 min-w-[112px] text-center">
       {m.score?<b dir="ltr" className={"font-display text-[40px] leading-none tabular-nums "+(live?"text-pink":"text-white")}>{m.score[0]}<span className="text-mute mx-1.5">:</span>{m.score[1]}</b>
       :<b className="font-display text-[34px] leading-none text-white tabular-nums">{kt}</b>}
      </div>
      {live?<span className="inline-flex items-center gap-2 text-pink text-sm font-semibold"><i className="live-dot !mb-0"/>{m.clock&&m.clock!=="0'"?<bdi dir="ltr">{m.clock}</bdi>:t(lang,"live")}</span>
      :post?<span className="text-xs text-mute rounded-full bg-white/5 px-3 py-1">{t(lang,"final")}</span>
      :<><span className="text-[11px] text-mute text-center">{kd}</span><Countdown lang={lang} to={m.kickoff} className="text-white text-sm font-semibold tabular-nums"/></>}
     </div>
     {side(1)}
    </div>
   </section>
   {diverge&&<div role="note" className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-s2 px-3 py-2.5 text-[13px] leading-6"><span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-loss/10 text-[#F08A8D] border border-loss/30 px-2.5 h-7 text-xs font-semibold">⚠️ {t(lang,"d2.diverge")}</span><span className="text-[#C9CCE0] min-w-0">{diverge}</span></div>}
   <nav id="tabs" aria-label={t(lang,"viz.tabs")} className="p-1 bg-card grid grid-cols-4 gap-1 rounded-xl border border-line">
    {TABS.map(x=><a key={x} href={tabHref(x)} aria-current={tab===x?"page":undefined} className={"min-h-[44px] grid place-items-center rounded-lg text-[13px] font-semibold "+(tab===x?"bg-white !text-[#0B0D14]":"text-mute hover:text-white hover:bg-hover")}>{t(lang,("viz.tab_"+x) as Key)}</a>)}
   </nav>
   {tab==="pred"&&<>
   {pp?<section className="panel relative overflow-hidden p-5 sm:p-6">
     <div className="flex items-center gap-4">
      <ProbRing h={pp.h} d={pp.d} a={pp.a} size={104} label={aiLabel} pct={aiPct} lang={lang}/>
      <div className="flex-1 min-w-0"><div className="text-xs text-mute">{t(lang,sealed?"m.ai_sealed":"m.ai_now")}</div>
       <div className="font-display text-2xl sm:text-3xl text-white mt-1 leading-tight"><bdi>{aiLabel}</bdi></div></div>
      <Seal size={64} className={"seal shrink-0 "+(sealed?"":"opacity-40")}>{sealed?<>{t(lang,"sealed")}<br/><span className="text-[9px] font-sans">{t(lang,"m.before")}</span></>:t(lang,"m.not_yet")}</Seal>
     </div>
     <ProbTiles p={pp} pick={pk2} lang={lang} labels={{h:m.home,d:DR,a:m.away}}/>
     {hist&&<Sparkline vals={hist} lang={lang}/>}
     {sealed&&<details className="mt-4 text-xs text-mute"><summary className="cursor-pointer min-h-[44px] flex items-center">{t(lang,"m.proof")}</summary>
       <p className="mt-1 leading-6">{t(lang,"m.sealed_at")} <bdi dir="ltr">{new Date(sealRow!.created_at).toLocaleString(locOf(lang),{timeZone:"Africa/Algiers"})}</bdi>{t(lang,"m.proof_txt")}</p>
       <code dir="ltr" className="block mt-2 break-all rounded-lg bg-bg border border-line p-2 text-[#C9CCE0]">{sealText}</code>
       <code dir="ltr" className="block mt-2 break-all rounded-lg bg-bg border border-line p-2 text-[#C9CCE0]">{sealHash}</code></details>}
     </section>
   :<section className="panel p-5 text-mute text-sm leading-7">{t(lang,"m.no_pred")}</section>}
   <section className="panel p-5 sm:p-6"><H2 c="bg-violet">{t(lang,"m.your_pick")}</H2>
    {m.sample?<p className="text-sm text-mute">{t(lang,"m.sample")}</p>
    :!open?<p className="text-sm text-mute leading-7">{mine?<>{t(lang,"m.your_sealed")} <b className="text-white"><bdi>{mine==="home"?W(m.home):mine==="away"?W(m.away):DR}</bdi></b>. </>:""}{t(lang,"m.closed")}</p>
    :me?<><p className="text-sm text-mute mb-4 leading-7">{t(lang,"m.choose")} <b className="text-white"><bdi>{me.nick}</bdi></b> {t(lang,"m.change")}</p><PickButtons lang={lang} matchId={key} home={m.home} away={m.away} hasDraw={hasDraw} current={mine}/>
      {mine&&<div className="mt-4"><ShareCard lang={lang} nick={me.nick} home={m.home} away={m.away} mine={mine==="home"?W(m.home):mine==="away"?W(m.away):DR} ai={aiK==="home"?W(m.home):aiK==="away"?W(m.away):aiK==="draw"?DR:null} aiPct={pp?(aiK==="home"?pp.h:aiK==="away"?pp.a:pp.d):null} kickoff={m.kickoff} url={url}/></div>}</>
    :<><p className="text-sm text-mute mb-4">{t(lang,"m.login_to")}</p><a href="/login" className="btn cta inline-flex items-center px-6 rounded-xl font-semibold">{t(lang,"m.login_cta")}</a></>}
   </section>
   {!m.sample&&<CrowdVsAI lang={lang} home={m.home} away={m.away} hasDraw={hasDraw} counts={counts} ai={aiK} mine={mine} revealed={!!mine||!open} outcome={outcome}/>}
   {!m.sample&&outcome&&<PostMortem lang={lang} m={m} outcome={outcome}/>}
   {!m.sample&&<div id="why" className="scroll-mt-20"><WhyCard lang={lang} m={m} sportPath={key.split("-")[0]} eid={eid}/></div>}
   {m.ext&&<Markets lang={lang} x={m.ext} home={m.home} away={m.away}/>}
   </>}
   {tab==="stats"&&<>
    {viz&&viz.axes.length>=3&&<section className="panel p-5 sm:p-6"><H2 c="bg-teal">{t(lang,"viz.radar")}</H2>
     <div className="flex justify-center gap-4 text-xs my-2"><span className="text-violet">● <bdi>{m.home}</bdi></span><span className="text-pink">● <bdi>{m.away}</bdi></span></div>
     <Radar axes={viz.axes} home={m.home} away={m.away} lang={lang}/>
     <p className="text-[11px] text-mute mt-2 leading-5">{t(lang,"viz.radar_note")}</p></section>}
    {viz&&viz.rows.length>0&&<section className="panel p-5 sm:p-6"><H2 c="bg-draw">{t(lang,"viz.pctl")}</H2><div className="mt-3"><PercentileBars rows={viz.rows} home={m.home} away={m.away} lang={lang}/></div></section>}
    {!m.sample&&<MatchCentre lang={lang} id={key} part="stats"/>}
   </>}
   {tab==="h2h"&&<>
    {viz&&(viz.wave.h.length>=3||viz.wave.a.length>=3)?<section className="panel p-5 sm:p-6"><H2 c="bg-violet">{t(lang,"viz.momentum")}</H2>
     <p className="text-[11px] text-mute mb-3 leading-5">{t(lang,"viz.momentum_note")}</p>
     <div className="grid gap-4 sm:grid-cols-2"><Momentum res={viz.wave.h} color="violet" name={m.home} lang={lang}/><Momentum res={viz.wave.a} color="pink" name={m.away} lang={lang}/></div></section>
    :<section className="panel p-5 text-sm text-mute">{t(lang,"viz.no_data")}</section>}
    {!m.sample&&<MatchCentre lang={lang} id={key} part="h2h"/>}
   </>}
   {tab==="line"&&!m.sample&&<MatchCentre lang={lang} id={key} part="lineups"/>}

   {!m.sample&&<Comments matchId={eid}/>}
  </div>);
}
