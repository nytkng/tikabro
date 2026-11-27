import type {Match} from "@/lib/types";
import {pickOf} from "@/lib/model";
import Crest from "./Crest";
import {t,locOf,type Lang} from "@/lib/i18n";
const time=(iso:string,l:Lang)=>new Date(iso).toLocaleTimeString(locOf(l),{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
export default function MatchRow({m,lang="ar"}:{m:Match;lang?:Lang}){
  const p=m.probs,pk=p?pickOf(p):null;
  const label=pk==="h"?m.home:pk==="a"?m.away:t(lang,"draw");
  const post=m.state==="post",live=m.state==="live";
  const win=(side:0|1)=>post&&m.score?(side===0?m.score[0]>m.score[1]:m.score[1]>m.score[0]):false;
  // هل صاب الـ AI؟ يبان غير كي تنتهي
  const aiHit=post&&m.score&&pk?(pk==="h"?m.score[0]>m.score[1]:pk==="a"?m.score[1]>m.score[0]:m.score[0]===m.score[1]):null;
  const team=(name:string,logo:string|null|undefined,g:number|undefined,w:boolean,ai:boolean)=>(<span className="flex items-center gap-2.5 min-w-0">
    <Crest name={name} size={24} logo={logo}/>
    <span className={"flex-1 min-w-0 truncate text-[14px] leading-6 "+(post&&!w?"text-mute":"text-white")+(w?" font-semibold":"")}><bdi>{name}</bdi></span>
    {ai&&<span className="ai-tick" title={t(lang,"ai_pick")} aria-label={t(lang,"ai_pick")}/>}
    {g!==undefined&&<b className={"score-cell tabular-nums "+(live?"text-pink":w||!post?"text-white":"text-mute")}>{g}</b>}</span>);
  return(<a href={`/match/${encodeURIComponent(m.id)}`} data-st={m.state} className="mrow group grid grid-cols-[52px_minmax(0,1fr)] sm:grid-cols-[60px_minmax(0,1fr)_168px] items-center gap-x-3 gap-y-2 py-2.5 px-3 rounded-xl">
   <span className="text-center leading-5 border-e border-line/70 pe-2 self-stretch grid place-items-center">{live?<span className="inline-flex flex-col items-center text-pink text-xs font-semibold tabular-nums"><i className="live-dot"/>{m.clock&&m.clock!=="0'"?<bdi dir="ltr">{m.clock}</bdi>:t(lang,"live")}</span>
     :post?<span className="text-[11px] text-mute">{t(lang,"final")}</span>:<span className="text-[13px] text-[#D5D8E6] font-semibold tabular-nums">{time(m.kickoff,lang)}</span>}</span>
   <span className="min-w-0 flex flex-col gap-1">{team(m.home,m.homeLogo,m.score?.[0],win(0),pk==="h")}{team(m.away,m.awayLogo,m.score?.[1],win(1),pk==="a")}</span>
   {p&&pk?<span className="col-start-2 sm:col-start-3 flex items-center gap-2 min-w-0">
     <span className={"ai-chip shrink-0 "+(aiHit===true?"hit":aiHit===false?"miss":"")}><span className="opacity-70">AI</span><b className="tabular-nums" dir="ltr">{p[pk]}%</b></span>
     <span className="flex-1 min-w-0 flex flex-col gap-1">
      <span className="flex h-[5px] rounded-full overflow-hidden gap-[2px] bg-line" aria-hidden><i style={{width:p.h+"%"}} className="bg-violet"/>{p.d>0&&<i style={{width:p.d+"%"}} className="bg-[#4A5273]"/>}<i style={{width:p.a+"%"}} className="bg-pink"/></span>
      <span className="text-[11px] text-mute truncate">{aiHit===true?t(lang,"hit")+": ":aiHit===false?t(lang,"miss")+": ":""}<bdi className="text-[#C9CCE0]">{label}</bdi></span>
     </span></span>
    :<span className="col-start-2 sm:col-start-3 text-[11px] text-mute">{t(lang,"low_data")}</span>}
  </a>);
}
