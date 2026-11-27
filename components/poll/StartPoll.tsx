"use client";
import {useState} from "react";
import {t,type Lang} from "@/lib/i18n";
export default function StartPoll({matchId,liveHref,lang="ar"}:{matchId:string;liveHref:string;lang?:Lang}){
  const [code,setCode]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
  async function go(){setBusy(true);setMsg("");
    try{const r=await fetch("/api/poll/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({matchId})});const j=await r.json();
      if(j.ok)setCode(j.code);else setMsg(j.msg||t(lang,"pl.err"))}catch{setMsg(t(lang,"pl.err"))}
    setBusy(false)}
  if(code)return <a href={`${liveHref}?poll=${code}`} target="_blank" className="shrink-0 min-h-11 px-4 inline-flex items-center rounded-xl bg-violet text-white font-bold">{t(lang,"pl.code")} <bdi dir="ltr" className="ms-1">{code}</bdi></a>;
  return <span className="shrink-0 flex flex-col items-end"><button onClick={go} disabled={busy} className="min-h-11 px-4 rounded-xl bg-violet/30 text-white font-semibold">{busy?"...":t(lang,"pl.start")}</button>{msg&&<small className="text-pink text-xs">{msg}</small>}</span>;
}
