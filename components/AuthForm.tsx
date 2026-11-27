"use client";
import {useEffect,useRef,useState} from "react";
const KEY=process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
const inp="w-full h-12 rounded-xl bg-bg border border-line px-4 text-white outline-none focus:border-violet";
export default function AuthForm(){
  const [mode,setMode]=useState<"new"|"back">("new");
  const [nick,setNick]=useState(""),[code,setCode]=useState(""),[adult,setAdult]=useState(false);
  const [err,setErr]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState<{nick:string;code:string}|null>(null);
  const tok=useRef(""),hp=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    if(!KEY)return;
    const s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js";s.async=true;
    (window as any).hadafTs=(t:string)=>{tok.current=t};document.head.appendChild(s);
  },[]);
  async function go(e:React.FormEvent){
    e.preventDefault();setErr("");setBusy(true);
    const url=mode==="new"?"/api/register":"/api/recover";
    const body=mode==="new"?{nick,adult,token:tok.current,website:hp.current?.value||""}:{nick,code};
    try{
      const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const j=await r.json().catch(()=>({}));
      if(!r.ok){setErr(j.msg||"صار خطأ، حاول مرة أخرى.");setBusy(false);return}
      if(mode==="new")setDone({nick:j.nick,code:j.code});else location.href="/";
    }catch{setErr("تعذّر الاتصال، تأكد من الإنترنت.");setBusy(false)}
  }
  if(done)return(<div className="space-y-4">
    <h1 className="text-2xl font-bold text-white">مرحبا {done.nick} 🎯</h1>
    <p className="text-mute text-sm leading-7">هذا <b className="text-white">كود الاسترجاع</b> تاعك. يظهر <b className="text-amber">مرة وحدة فقط</b>. صوّرو أو احفظو، لأنو هو الطريقة الوحيدة باش ترجع لحسابك من جهاز آخر.</p>
    <div dir="ltr" className="rounded-xl border border-amber/50 bg-bg text-amber text-center text-2xl font-mono tracking-widest py-4 select-all">{done.code}</div>
    <a href="/" className="btn flex items-center justify-center w-full h-12 rounded-xl bg-violet text-bg font-semibold">حفظته، ادخل الأرينا</a></div>);
  return(<form onSubmit={go} className="space-y-4">
    <div className="flex gap-2 p-1 rounded-xl bg-bg border border-line">
      {(["new","back"] as const).map(m=><button type="button" key={m} onClick={()=>{setMode(m);setErr("")}} className={"flex-1 h-10 rounded-lg text-sm font-semibold "+(mode===m?"bg-violet text-bg":"text-mute")}>{m==="new"?"حساب جديد":"عندي حساب"}</button>)}</div>
    <label className="block text-sm text-mute">الاسم المستعار<input className={inp+" mt-1.5"} value={nick} onChange={e=>setNick(e.target.value)} maxLength={20} autoComplete="username" placeholder="مثلا: خبير_الأحد" required/></label>
    {mode==="back"&&<label className="block text-sm text-mute">كود الاسترجاع<input dir="ltr" className={inp+" mt-1.5 font-mono tracking-widest"} value={code} onChange={e=>setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX" required/></label>}
    {mode==="new"&&<>
      <input ref={hp} name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true"/>
      <label className="flex gap-3 items-start text-sm text-mute leading-6"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)} className="mt-1.5 size-4 accent-violet"/>أؤكد أني بلغت 18 سنة، وأوافق على <a href="/legal" className="text-violet underline">الشروط والخصوصية</a>. الموقع للتوقعات فقط ولا فيه مراهنة.</label>
      {KEY&&<div className="cf-turnstile" data-sitekey={KEY} data-callback="hadafTs"/>}</>}
    {err&&<p role="alert" className="text-pink text-sm">{err}</p>}
    <button disabled={busy||(mode==="new"&&!adult)} className="btn w-full h-12 rounded-xl bg-violet text-bg font-semibold disabled:opacity-50">{busy?"لحظة...":mode==="new"?"سجّل وادخل":"ادخل"}</button>
    <p className="text-xs text-mute leading-6">بلا كلمة سر وبلا إيميل. الدخول بحساب Google يجي قريبا.</p></form>);
}
