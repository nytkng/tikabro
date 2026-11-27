"use client";
import {useState} from "react";
type K="home"|"draw"|"away";
export default function PickButtons({matchId,home,away,hasDraw,current}:{matchId:string;home:string;away:string;hasDraw:boolean;current:K|null}){
  const [cur,setCur]=useState<K|null>(current),[busy,setBusy]=useState<K|null>(null),[msg,setMsg]=useState("");
  async function go(k:K){
    setBusy(k);setMsg("");
    try{
      const r=await fetch("/api/pick",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({matchId,pick:k})});
      const j=await r.json().catch(()=>({}));
      if(r.ok){setCur(k);setMsg("تم ختم توقعك ✓ تقدر تبدلو قبل البداية.")}else setMsg(j.msg||"صار خطأ.");
    }catch{setMsg("تعذّر الاتصال.")}
    setBusy(null);
  }
  const opts:[K,string,string][]=[["home","فوز "+home,"bg-violet"],...(hasDraw?[["draw","تعادل","bg-[#4A5273]"] as [K,string,string]]:[]),["away","فوز "+away,"bg-pink"]];
  return(<div><div className="grid gap-2.5 sm:grid-flow-col sm:auto-cols-fr">{opts.map(([k,t,c])=>
    <button key={k} onClick={()=>go(k)} disabled={!!busy} className={"btn min-h-12 rounded-xl px-4 py-2 font-semibold text-center leading-6 transition "+(cur===k?`${c} text-white ring-2 ring-white/70`:"border border-line text-white hover:bg-white/5")+(busy===k?" opacity-60":"")}>{cur===k&&"✓ "}{t}</button>)}</div>
   {msg&&<p role="status" className="text-sm mt-3 text-[#C9CCE0]">{msg}</p>}</div>);
}
