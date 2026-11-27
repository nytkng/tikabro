import type {Match} from "@/lib/types";
import {pickOf} from "@/lib/model";
import Crest from "./Crest";
const time=(iso:string)=>new Date(iso).toLocaleTimeString("ar-DZ",{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
export default function MatchRow({m}:{m:Match}){
  const p=m.probs,pk=p?pickOf(p):null;
  const label=pk==="h"?m.home:pk==="a"?m.away:"تعادل";
  const win=(side:0|1)=>m.state==="post"&&m.score?(side===0?m.score[0]>m.score[1]:m.score[1]>m.score[0]):false;
  const team=(name:string,logo:string|null|undefined,g:number|undefined,w:boolean)=>(<span className="flex items-center gap-3 min-w-0">
    <Crest name={name} size={26} logo={logo}/><span className={"flex-1 min-w-0 leading-6 truncate "+(m.state==="post"&&!w?"text-mute":"text-white")}>{name}</span>
    {g!==undefined&&<b className={"text-lg tabular-nums "+(m.state==="live"?"text-pink":w||m.state!=="post"?"text-white":"text-mute")}>{g}</b>}</span>);
  return(<a href={`/match/${encodeURIComponent(m.id)}`} className="grid grid-cols-[56px_1fr] sm:grid-cols-[64px_1fr_200px] items-center gap-x-4 gap-y-2 py-3 px-2 border-t border-line first:border-0 hover:bg-white/[0.03] rounded-lg">
   <span className="text-xs text-center leading-5">{m.state==="live"?<span className="inline-flex flex-col items-center text-pink font-semibold"><i className="live-dot"/>{m.clock&&m.clock!=="0'"?m.clock:"مباشر"}</span>
     :m.state==="post"?<span className="text-mute">انتهت</span>:<span className="text-[#C9CCE0] tabular-nums">{time(m.kickoff)}</span>}</span>
   <span className="min-w-0 flex flex-col gap-1.5">{team(m.home,m.homeLogo,m.score?.[0],win(0))}{team(m.away,m.awayLogo,m.score?.[1],win(1))}</span>
   {p?<span className="col-start-2 sm:col-start-3 flex flex-col gap-1"><span className="flex h-1.5 rounded-full overflow-hidden gap-[2px]"><i style={{width:p.h+"%"}} className="bg-violet"/>{p.d>0&&<i style={{width:p.d+"%"}} className="bg-[#4A5273]"/>}<i style={{width:p.a+"%"}} className="bg-pink"/></span>
    <span className="text-[11px] text-mute truncate">توقع الـ AI: <bdi className="text-[#C9CCE0] font-semibold">{label}</bdi> <bdi dir="ltr">{p[pk as "h"]}%</bdi></span></span>
    :<span className="col-start-2 sm:col-start-3 text-[11px] text-mute">بيانات غير كافية للتوقع</span>}
  </a>);
}
