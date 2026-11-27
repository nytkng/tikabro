import type {Match} from "@/lib/types";
import {pickOf} from "@/lib/model";
import Crest from "./Crest";
const time=(iso:string)=>new Date(iso).toLocaleTimeString("ar-DZ",{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
export default function MatchRow({m}:{m:Match}){
  const p=m.probs,pk=p?pickOf(p):null;
  const label=pk==="h"?m.home:pk==="a"?m.away:"تعادل";
  const team=(name:string,g?:number)=>(<span className="flex items-center gap-3 min-w-0"><Crest name={name} size={30}/><span className="flex-1 min-w-0 text-white leading-6 break-words">{name}</span>{g!==undefined&&<b className="text-white text-lg tabular-nums">{g}</b>}</span>);
  return(<a href={`/match/${encodeURIComponent(m.id)}`} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 py-4 border-t border-line first:border-0 hover:bg-white/[0.02] rounded-lg px-2">
   <span className="sm:w-14 text-mute text-sm shrink-0">{m.state==="live"?<b className="text-pink">مباشر</b>:time(m.kickoff)}</span>
   <span className="flex-1 min-w-0 flex flex-col gap-2">{team(m.home,m.score?.[0])}{team(m.away,m.score?.[1])}</span>
   {p?<span className="flex flex-col gap-1.5 sm:w-52 shrink-0"><span className="flex h-2 rounded-full overflow-hidden gap-[2px]"><i style={{width:p.h+"%"}} className="bg-violet"/>{p.d>0&&<i style={{width:p.d+"%"}} className="bg-[#4A5273]"/>}<i style={{width:p.a+"%"}} className="bg-pink"/></span>
    <span className="text-xs text-mute">توقع الـ AI: <b className="text-white">{label}</b> · {p[pk as "h"]}%</span></span>:<span className="text-xs text-mute sm:w-52">لا توقع بعد (بيانات غير كافية)</span>}
  </a>);
}
