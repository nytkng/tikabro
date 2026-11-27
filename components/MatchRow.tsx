import type {Match} from "@/lib/types";
import {pickOf} from "@/lib/model";
import Crest from "./Crest";
const time=(iso:string)=>new Date(iso).toLocaleTimeString("ar-DZ",{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
export default function MatchRow({m}:{m:Match}){
  const p=m.probs,pk=p?pickOf(p):null;
  const label=pk==="h"?m.home:pk==="a"?m.away:"تعادل";
  return(<a href={`/match/${encodeURIComponent(m.id)}`} className="flex flex-wrap items-center gap-4 py-4 border-t border-line first:border-0 hover:bg-white/[0.02] rounded-lg px-2">
   <span className="w-14 text-mute text-sm">{m.state==="live"?<b className="text-pink">مباشر</b>:time(m.kickoff)}</span>
   <span className="flex-1 min-w-[220px] flex items-center gap-3"><Crest name={m.home} size={32}/><span className="text-white">{m.home}</span>
    <span className="text-mute px-1">{m.score?`${m.score[0]} - ${m.score[1]}`:"ضد"}</span>
    <Crest name={m.away} size={32}/><span className="text-white">{m.away}</span></span>
   {p?<span className="flex flex-col gap-1 w-48"><span className="flex h-2 rounded-full overflow-hidden gap-[2px]"><i style={{width:p.h+"%"}} className="bg-violet"/><i style={{width:p.d+"%"}} className="bg-[#4A5273]"/><i style={{width:p.a+"%"}} className="bg-pink"/></span>
    <span className="text-xs text-mute">توقع الـ AI: <b className="text-white">{label}</b> · {p[pk as "h"]}%</span></span>:<span className="text-xs text-mute w-48">لا توقع بعد (بيانات غير كافية)</span>}
  </a>);
}
