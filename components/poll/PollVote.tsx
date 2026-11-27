"use client";
import {useState} from "react";
import Crest from "@/components/Crest";
type K="home"|"draw"|"away";type C=Record<K,number>;
export default function PollVote({code,open,initial,draw,home,away,homeLogo,awayLogo,L}:{code:string;open:boolean;initial:C;draw:boolean;home:string;away:string;homeLogo:string|null;awayLogo:string|null;L:Record<string,string>}){
  const [c,setC]=useState(initial),[mine,setMine]=useState<K|null>(null),[busy,setBusy]=useState(false),[err,setErr]=useState(""),[closed,setClosed]=useState(!open);
  const n=c.home+c.draw+c.away,pc=(k:K)=>n?Math.round(c[k]*100/n):0,show=!!mine||closed;
  async function vote(k:K){
    if(busy||closed)return;setBusy(true);setErr("");
    try{const r=await fetch("/api/poll/vote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,choice:k})});const j=await r.json();
      if(j.ok){setMine(k);setC(j.counts)}else{setErr(j.msg||L.error);if(r.status===409)setClosed(true)}}catch{setErr(L.error)}
    setBusy(false);
  }
  const opts:[K,string,string|null][]=[["home",home,homeLogo],...(draw?[["draw",L.draw,null] as [K,string,null]]:[]),["away",away,awayLogo]];
  return(<div className="flex flex-col gap-3">
   <p className="text-center text-mute text-lg">{closed?<b className="text-pink">{L.closed}</b>:L.ask}</p>
   {opts.map(([k,name,logo])=><button key={k} onClick={()=>vote(k)} disabled={busy||closed} aria-pressed={mine===k}
     className={"relative overflow-hidden min-h-24 rounded-2xl border-2 px-5 flex items-center gap-4 text-start active:scale-[.98] transition "+(mine===k?"border-amber bg-amber/10":"border-line bg-card")}>
     {show&&<span aria-hidden className="absolute inset-y-0 start-0 bg-violet/20" style={{width:pc(k)+"%"}}/>}
     <span className="relative">{k==="draw"?<span className="grid place-items-center w-14 h-14 rounded-full bg-surface text-white text-2xl font-bold">=</span>:<Crest name={name} size={56} logo={logo}/>}</span>
     <b className="relative flex-1 text-white text-2xl truncate"><bdi>{name}</bdi></b>
     {show&&<span className="relative font-display text-3xl text-white tabular-nums">{pc(k)}%</span>}
   </button>)}
   {show&&<p className="text-center text-mute tabular-nums">{L.votes.replace("{n}",String(n))}</p>}
   {mine&&<p className="text-center text-amber">{L.voted}</p>}
   {err&&<p className="text-center text-pink">{err}</p>}
   {show&&<a href="/login" className="min-h-14 rounded-2xl bg-amber text-[#0B0D14] font-bold text-lg grid place-items-center">{L.cta}</a>}
  </div>);
}
