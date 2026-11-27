import type {Match} from "@/lib/types";
import {pickOf} from "@/lib/model";
import Crest from "@/components/Crest";
import ProbRing from "@/components/ui/ProbRing";
const time=(iso:string)=>new Date(iso).toLocaleString("ar-DZ",{weekday:"short",hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
export const href=(m:Match)=>`/match/${encodeURIComponent(m.id)}`;
export function Section({title,sub,children,n}:{title:string;sub:string;children:React.ReactNode;n:number}){
  return(<section className="panel p-4 sm:p-5">
    <h2 className="font-display text-[19px] text-white flex items-center gap-2">{title}<span className="text-[11px] text-mute bg-white/5 rounded-full px-2">{n}</span></h2>
    <p className="text-[12.5px] text-mute mt-1 mb-4">{sub}</p>
    {n?children:<p className="text-[13px] text-mute py-6 text-center">ما كاين والو هنا دركا، ارجع من بعد.</p>}
  </section>);
}
export function Teams({m}:{m:Match}){
  return(<span className="min-w-0 flex-1 flex flex-col gap-1.5">
    {([[m.home,m.homeLogo,0],[m.away,m.awayLogo,1]] as const).map(([n,l,i])=><span key={i} className="flex items-center gap-2 min-w-0"><Crest name={n} size={22} logo={l}/><bdi className="truncate text-[14px] text-white flex-1">{n}</bdi>{m.score&&<b className="score-cell tabular-nums">{m.score[i]}</b>}</span>)}
    <span className="text-[11px] text-mute truncate">{m.league} · {m.state==="post"?"انتهت":time(m.kickoff)}</span>
  </span>);
}
export function RingCard({m,note}:{m:Match;note?:React.ReactNode}){
  const p=m.probs!,k=pickOf(p);const label=k==="h"?m.home:k==="a"?m.away:"تعادل";
  return(<a href={href(m)} className="mrow flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
    <ProbRing h={p.h} d={p.d} a={p.a} size={72} label={label} pct={p[k]}/>
    <span className="min-w-0 flex-1 flex flex-col gap-1"><Teams m={m}/>{note&&<span className="text-[12px] text-[#C9CCE0]">{note}</span>}</span>
  </a>);
}
