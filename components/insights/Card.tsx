import type {Match} from "@/lib/types";
import {pickOf} from "@/lib/model";
import Crest from "@/components/Crest";
import ProbRing from "@/components/ui/ProbRing";
import {t,locOf,leagueOf,type Lang} from "@/lib/i18n";
const time=(iso:string,l:Lang)=>new Date(iso).toLocaleString(locOf(l),{weekday:"short",hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
export const href=(m:Match)=>`/match/${encodeURIComponent(m.id)}`;
export function Section({title,sub,children,n,lang="ar"}:{title:string;sub:string;children:React.ReactNode;n:number;lang?:Lang}){
  return(<section className="panel p-4 sm:p-5">
    <h2 className="font-display text-[19px] text-white flex items-center gap-2">{title}<span className="text-[11px] text-mute bg-white/5 rounded-full px-2">{n}</span></h2>
    <p className="text-[12.5px] text-mute mt-1 mb-4">{sub}</p>
    {n?children:<p className="text-[13px] text-mute py-6 text-center">{t(lang,"i.empty")}</p>}
  </section>);
}
export function Teams({m,lang="ar"}:{m:Match;lang?:Lang}){
  return(<span className="min-w-0 flex-1 flex flex-col gap-1.5">
    {([[m.home,m.homeLogo,0],[m.away,m.awayLogo,1]] as const).map(([n,l,i])=><span key={i} className="flex items-center gap-2 min-w-0"><Crest name={n} size={22} logo={l}/><bdi className="truncate text-[14px] text-white flex-1">{n}</bdi>{m.score&&<b className="score-cell tabular-nums">{m.score[i]}</b>}</span>)}
    <span className="text-[11px] text-mute truncate">{leagueOf(m,lang)} · {m.state==="post"?t(lang,"final"):time(m.kickoff,lang)}</span>
  </span>);
}
export function RingCard({m,note,lang="ar"}:{m:Match;note?:React.ReactNode;lang?:Lang}){
  const p=m.probs!,k=pickOf(p);const label=k==="h"?m.home:k==="a"?m.away:t(lang,"draw");
  return(<a href={href(m)} className="mrow flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
    <ProbRing h={p.h} d={p.d} a={p.a} size={72} label={label} pct={p[k]} lang={lang}/>
    <span className="min-w-0 flex-1 flex flex-col gap-1"><Teams m={m} lang={lang}/>{note&&<span className="text-[12px] text-[#C9CCE0]">{note}</span>}</span>
  </a>);
}
