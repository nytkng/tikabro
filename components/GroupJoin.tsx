"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {t,dirOf,type Lang} from "@/lib/i18n";
type Mode="create"|"join"|"leave"|"joinCode";
export default function GroupJoin({mode,code,lang="ar"}:{mode:Mode;code?:string;lang?:Lang}){
  const router=useRouter();const [v,setV]=useState("");const [busy,setBusy]=useState(false);const [err,setErr]=useState("");
  async function go(e?:React.FormEvent){
    e?.preventDefault();if(busy)return;
    if(mode==="leave"&&!confirm(t(lang,"gr.confirm_leave")))return;
    setBusy(true);setErr("");
    const api=mode==="create"?"create":mode==="leave"?"leave":"join";
    const body=mode==="create"?{name:v}:mode==="join"?{code:v}:{code};
    try{
      const r=await fetch(`/api/groups/${api}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const j=await r.json().catch(()=>null);
      if(!r.ok||!j?.ok){setErr(j?.msg||t(lang,"gr.err"));return}
      if(mode==="leave")router.push("/groups");
      else if(mode==="joinCode")router.refresh();
      else router.push(`/groups/${j.code}`);
      router.refresh();
    }catch{setErr(t(lang,"gr.net"))}finally{setBusy(false)}
  }
  const btn="btn h-11 rounded-xl bg-white !text-[#0B0D14] font-semibold px-5 disabled:opacity-60";
  if(mode==="leave")return(<div><button onClick={()=>go()} disabled={busy} className="text-sm text-mute hover:text-pink">{busy?"...":t(lang,"gr.leave")}</button>{err&&<p className="text-pink text-sm mt-2">{err}</p>}</div>);
  if(mode==="joinCode")return(<div><button onClick={()=>go()} disabled={busy} className={btn}>{busy?"...":t(lang,"gr.join_this")}</button>{err&&<p className="text-pink text-sm mt-2">{err}</p>}</div>);
  return(<form onSubmit={go} className="flex flex-col gap-2">
    <div className="flex gap-2">
      <input value={v} onChange={e=>setV(e.target.value)} maxLength={mode==="create"?40:12} required
        placeholder={t(lang,mode==="create"?"gr.ph_name":"gr.ph_code")} dir={mode==="join"?"ltr":dirOf(lang)}
        className="flex-1 min-w-0 h-11 rounded-xl bg-bg border border-line px-3 text-white placeholder:text-mute uppercase-none"/>
      <button disabled={busy} className={btn}>{busy?"...":t(lang,mode==="create"?"gr.create":"gr.join")}</button>
    </div>
    {err&&<p className="text-pink text-sm">{err}</p>}
  </form>);
}
