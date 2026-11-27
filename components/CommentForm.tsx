"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function CommentForm({matchId}:{matchId:string}){
  const [t,setT]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState<string|null>(null);
  const router=useRouter();const n=t.trim().length;
  async function send(e:React.FormEvent){
    e.preventDefault();if(busy||n<1||n>280)return;setBusy(true);setMsg(null);
    try{
      const r=await fetch("/api/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({matchId,body:t})});
      const j:any=await r.json().catch(()=>({}));
      if(!r.ok){setMsg(j?.msg||"صرا مشكل.");return}
      setT("");router.refresh();
    }catch{setMsg("صرا مشكل في الاتصال.")}finally{setBusy(false)}
  }
  return(<form onSubmit={send} className="flex flex-col gap-2">
    <textarea value={t} onChange={e=>setT(e.target.value.slice(0,280))} rows={3} maxLength={280} placeholder="واش راك تشوف في هذي المباراة؟"
      className="w-full resize-none rounded-xl bg-bg border border-line focus:border-violet outline-none p-3 text-sm text-ink placeholder:text-mute leading-6"/>
    <div className="flex items-center justify-between gap-3">
      <span dir="ltr" className={"text-xs tabular-nums "+(n>260?"text-amber":"text-mute")}>{n}/280</span>
      <button disabled={busy||n<1} className="btn cta min-h-[44px] px-5 rounded-xl font-semibold disabled:opacity-50">{busy?"...":"انشر"}</button>
    </div>
    {msg&&<p role="alert" className="text-xs text-pink">{msg}</p>}
  </form>);
}
export function ReportButton({id}:{id:number}){
  const [s,setS]=useState<"idle"|"busy"|"done">("idle");const router=useRouter();
  async function go(){
    if(s!=="idle"||!confirm("تبلّغ على هذا التعليق؟"))return;setS("busy");
    const r=await fetch("/api/comments/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}).catch(()=>null);
    setS(r?.ok?"done":"idle");if(r?.ok)router.refresh();
  }
  return <button onClick={go} disabled={s!=="idle"} className="text-[11px] text-mute hover:text-pink min-h-[32px] px-2 disabled:opacity-60">{s==="done"?"تبلّغ ✓":"بلّغ"}</button>;
}
