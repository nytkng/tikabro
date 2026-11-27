"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {t,type Lang} from "@/lib/i18n";
type K="home"|"draw"|"away";
export default function PickButtons({matchId,home,away,hasDraw,current,lang="ar"}:{matchId:string;home:string;away:string;hasDraw:boolean;current:K|null;lang?:Lang}){
  const router=useRouter();
  const [cur,setCur]=useState<K|null>(current),[busy,setBusy]=useState<K|null>(null),[msg,setMsg]=useState("");
  async function go(k:K){
    setBusy(k);setMsg("");
    try{
      const r=await fetch("/api/pick",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({matchId,pick:k})});
      const j=await r.json().catch(()=>({}));
      if(r.ok){setCur(k);setMsg(t(lang,"p.ok"));router.refresh()}else setMsg(j.msg||t(lang,"err"));
    }catch{setMsg(t(lang,"conn"))}
    setBusy(null);
  }
  const opts:[K,string,string][]=[["home",t(lang,"win",{t:home}),"from-[#9C8FFF] to-[#7565F0]"],...(hasDraw?[["draw",t(lang,"draw"),"from-[#5A6388] to-[#434B6C]"] as [K,string,string]]:[]),["away",t(lang,"win",{t:away}),"from-[#F08DB5] to-[#D9638F]"]];
  return(<div><div role="radiogroup" aria-label={t(lang,"m.your_pick")} className="seg !gap-1.5 !p-1.5 !rounded-2xl">{opts.map(([k,t,c])=>{const on=cur===k;
    return <button key={k} role="radio" aria-checked={on} onClick={()=>go(k)} disabled={!!busy}
      className={"relative flex-1 min-w-0 min-h-[60px] rounded-xl px-2 py-2 text-[14px] font-semibold leading-5 text-center transition-[transform,background,box-shadow] duration-150 active:scale-[.95] active:translate-y-px motion-reduce:transform-none "+(on?`bg-gradient-to-b ${c} text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,.8),inset_0_1px_0_rgba(255,255,255,.35)]`:"text-[#C9CCE0] hover:bg-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,.35)] bg-white/[.02]")+(busy===k?" animate-pulse":"")}>
      {on&&<span aria-hidden className="absolute -top-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 w-5 h-5 rounded-full bg-amber text-[#1A1206] text-[11px] grid place-items-center shadow">✓</span>}
      <bdi className="line-clamp-2 break-words">{t}</bdi></button>})}</div>
   {msg&&<p role="status" className="text-sm mt-3 text-[#C9CCE0]">{msg}</p>}</div>);
}
