"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Mode="create"|"join"|"leave"|"joinCode";
export default function GroupJoin({mode,code}:{mode:Mode;code?:string}){
  const router=useRouter();const [v,setV]=useState("");const [busy,setBusy]=useState(false);const [err,setErr]=useState("");
  async function go(e?:React.FormEvent){
    e?.preventDefault();if(busy)return;
    if(mode==="leave"&&!confirm("متأكد تحب تخرج من هذا الدوري؟"))return;
    setBusy(true);setErr("");
    const api=mode==="create"?"create":mode==="leave"?"leave":"join";
    const body=mode==="create"?{name:v}:mode==="join"?{code:v}:{code};
    try{
      const r=await fetch(`/api/groups/${api}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const j=await r.json().catch(()=>null);
      if(!r.ok||!j?.ok){setErr(j?.msg||"صار مشكل، عاود.");return}
      if(mode==="leave")router.push("/groups");
      else if(mode==="joinCode")router.refresh();
      else router.push(`/groups/${j.code}`);
      router.refresh();
    }catch{setErr("تعذّر الاتصال، عاود.")}finally{setBusy(false)}
  }
  const btn="btn h-11 rounded-xl bg-white !text-[#0B0D14] font-semibold px-5 disabled:opacity-60";
  if(mode==="leave")return(<div><button onClick={()=>go()} disabled={busy} className="text-sm text-mute hover:text-pink">{busy?"...":"اخرج من الدوري"}</button>{err&&<p className="text-pink text-sm mt-2">{err}</p>}</div>);
  if(mode==="joinCode")return(<div><button onClick={()=>go()} disabled={busy} className={btn}>{busy?"...":"ادخل لهذا الدوري"}</button>{err&&<p className="text-pink text-sm mt-2">{err}</p>}</div>);
  return(<form onSubmit={go} className="flex flex-col gap-2">
    <div className="flex gap-2">
      <input value={v} onChange={e=>setV(e.target.value)} maxLength={mode==="create"?40:12} required
        placeholder={mode==="create"?"اسم الدوري (مثلا: صحاب الحومة)":"كود الدعوة (8 حروف)"} dir={mode==="join"?"ltr":"rtl"}
        className="flex-1 min-w-0 h-11 rounded-xl bg-bg border border-line px-3 text-white placeholder:text-mute uppercase-none"/>
      <button disabled={busy} className={btn}>{busy?"...":mode==="create"?"أنشئ":"ادخل"}</button>
    </div>
    {err&&<p className="text-pink text-sm">{err}</p>}
  </form>);
}
