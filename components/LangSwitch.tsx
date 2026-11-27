"use client";
// مبدّل اللغة: ع / FR / EN. يحفظ الكوكي ويعاود يحمّل الصفحة.
import {useState} from "react";
import type {Lang} from "@/lib/i18n";
const L:[Lang,string][]=[["ar","ع"],["fr","FR"],["en","EN"]];
export default function LangSwitch({lang,label}:{lang:Lang;label:string}){
  const [busy,setBusy]=useState(false);
  async function go(l:Lang){if(l===lang||busy)return;setBusy(true);
    try{await fetch("/api/lang",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang:l})})}catch{}
    location.reload()}
  return(<div role="group" aria-label={label} className="flex items-center gap-0.5 rounded-full bg-white/[0.03] border border-white/10 p-0.5 shrink-0">
    {L.map(([k,t])=><button key={k} type="button" lang={k} onClick={()=>go(k)} aria-pressed={k===lang} disabled={busy}
      className={"h-7 min-w-7 px-1.5 rounded-full text-[11px] font-semibold "+(k===lang?"bg-white text-[#0B0E13]":"text-[#BCC1D6] hover:text-white")}>{t}</button>)}
  </div>);
}
