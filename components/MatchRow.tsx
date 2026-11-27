import type {Match} from "@/lib/types";
import {pickOf} from "@/lib/model";
import Crest from "./Crest";
import {FormBoxes} from "./viz/Viz";
import {t,locOf,type Lang} from "@/lib/i18n";
const time=(iso:string,l:Lang)=>new Date(iso).toLocaleTimeString(locOf(l),{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
// لون ثابت من اسم الفريق (ما عندناش ألوان رسمية → ما نزوّروش)
const hue=(n:string)=>{let h=0;for(let i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))>>>0;return h%360};
function Trend({v}:{v:number[]}){const W=56,H=16,mn=Math.min(...v),mx=Math.max(...v),r=mx-mn||1;
  const pts=v.map((x,i)=>`${(i*(W-2)/(v.length-1)+1).toFixed(1)},${(H-1-(x-mn)*(H-2)/r).toFixed(1)}`).join(" ");
  return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="shrink-0"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg>}
export default function MatchRow({m,lang="ar",hist}:{m:Match;lang?:Lang;hist?:[number,number,number][]}){
  const p=m.probs,pk=p?pickOf(p):null;
  const label=pk==="h"?m.home:pk==="a"?m.away:t(lang,"draw");
  const post=m.state==="post",live=m.state==="live";
  const win=(side:0|1)=>post&&m.score?(side===0?m.score[0]>m.score[1]:m.score[1]>m.score[0]):false;
  // هل صاب الـ AI؟ يبان غير كي تنتهي
  const pi=pk==="h"?0:pk==="d"?1:2;
  const tv=p&&pk&&hist&&hist.length>=2&&!post?hist.map(x=>x[pi]):null;
  const t0=tv?tv[0]:0,t1=tv?tv[tv.length-1]:0;
  const href=`/match/${encodeURIComponent(m.id)}`;
  const aiHit=post&&m.score&&pk?(pk==="h"?m.score[0]>m.score[1]:pk==="a"?m.score[1]>m.score[0]:m.score[0]===m.score[1]):null;
  const team=(name:string,logo:string|null|undefined,g:number|undefined,w:boolean,ai:boolean,f?:string|null)=>(<span className="flex items-center gap-2.5 min-w-0">
    <Crest name={name} size={24} logo={logo}/>
    <span className={"flex-1 min-w-0 truncate text-[14px] leading-6 "+(post&&!w?"text-mute":"text-white")+(w?" font-semibold":"")}><bdi>{name}</bdi></span>
    {!post&&!live&&<FormBoxes f={f} lang={lang}/>}
    {ai&&<span className="ai-tick" title={t(lang,"ai_pick")} aria-label={t(lang,"ai_pick")}/>}
    {g!==undefined&&<b className={"score-cell tabular-nums "+(live?"text-pink":w||!post?"text-white":"text-mute")}>{g}</b>}</span>);
  return(<div data-st={m.state} style={{["--club" as string]:`hsl(${hue(m.home)} 55% 52%)`}} className="mrow club group grid grid-cols-[52px_minmax(0,1fr)] sm:grid-cols-[60px_minmax(0,1fr)_168px] items-center gap-x-3 gap-y-2 py-2.5 px-3 rounded-xl">
   <a href={href} className="absolute inset-0 rounded-xl z-0" aria-label={`${m.home} – ${m.away}`}/>
   <span className="pointer-events-none text-center leading-5 border-e border-line/70 pe-2 self-stretch grid place-items-center">{live?<span className="inline-flex flex-col items-center text-pink text-xs font-semibold tabular-nums"><i className="live-dot"/>{m.clock&&m.clock!=="0'"?<bdi dir="ltr">{m.clock}</bdi>:t(lang,"live")}</span>
     :post?<span className="text-[11px] text-mute">{t(lang,"final")}</span>:<span className="text-[13px] text-[#D5D8E6] font-semibold tabular-nums">{time(m.kickoff,lang)}</span>}</span>
   <span className="pointer-events-none min-w-0 flex flex-col gap-1">{team(m.home,m.homeLogo,m.score?.[0],win(0),pk==="h",m.homeForm)}{team(m.away,m.awayLogo,m.score?.[1],win(1),pk==="a",m.awayForm)}</span>
   {p&&pk?<span className="pointer-events-none col-start-2 sm:col-start-3 flex items-center gap-2 min-w-0">
     <span title={t(lang,"mr.ai_t",{x:label})} className={"ai-chip shrink-0 "+(aiHit===true?"hit":aiHit===false?"miss":"")}><span className="opacity-70">AI</span><b className="tabular-nums" dir="ltr">{p[pk]}%</b></span>
     <span className="flex-1 min-w-0 flex flex-col gap-1">
      <span className="flex h-[5px] rounded-full overflow-hidden gap-[2px] bg-line" aria-hidden><i style={{width:p.h+"%"}} className="bg-violet"/>{p.d>0&&<i style={{width:p.d+"%"}} className="bg-[#4A5273]"/>}<i style={{width:p.a+"%"}} className="bg-pink"/></span>
      <span className="flex items-center gap-1.5 min-w-0 text-[11px]"><span className="text-mute truncate flex-1 min-w-0">{aiHit===true?t(lang,"hit")+": ":aiHit===false?t(lang,"miss")+": ":""}<bdi className="text-[#C9CCE0]">{label}</bdi>{aiHit===false&&m.score&&m.score[0]===m.score[1]?" · "+t(lang,"mr.was_draw"):""}</span>
       {tv&&t0!==t1&&<span title={t(lang,"d2.trend")} className={"flex items-center gap-1 shrink-0 tabular-nums "+(t1>t0?"text-win":"text-loss")}><bdi dir="ltr">{t0}% → {t1}%</bdi><Trend v={tv}/></span>}
       {!post&&<a href={href+"#why"} title={t(lang,"d2.why")} aria-label={t(lang,"d2.why")} className="pointer-events-auto relative z-10 shrink-0 grid place-items-center w-6 h-6 -my-1 rounded-full border border-line text-mute hover:text-white hover:border-[#3A4352]">؟</a>}</span>
      {!post&&!live&&<span className="honest text-[10px] text-mute leading-4 truncate">{t(lang,"d2.honest",{p:p[pk],n:Math.round(p[pk]/10)})}</span>}
     </span></span>
    :<span className="pointer-events-none col-start-2 sm:col-start-3 text-[11px] text-mute">{t(lang,"low_data")}</span>}
  </div>);
}
