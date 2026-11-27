"use client";
import {useEffect,useRef,useState} from "react";
const KEY=process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
const inp="w-full min-w-0 h-12 rounded-xl bg-[#0A0D17] border border-line px-4 text-white outline-none focus:border-amber";
export default function AuthForm({google=false,gOn=false,gMsg=""}:{google?:boolean;gOn?:boolean;gMsg?:string}){
  const [mode,setMode]=useState<"new"|"back">("new");
  const [nick,setNick]=useState(""),[code,setCode]=useState(""),[adult,setAdult]=useState(false);
  const [err,setErr]=useState(gMsg),[busy,setBusy]=useState(false),[done,setDone]=useState<{nick:string;code:string}|null>(null);
  const tok=useRef(""),hp=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    if(!KEY)return;
    const s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js";s.async=true;
    (window as any).hadafTs=(t:string)=>{tok.current=t};document.head.appendChild(s);
  },[]);
  async function go(e:React.FormEvent){
    e.preventDefault();setErr("");setBusy(true);
    const url=mode==="new"?"/api/register":"/api/recover";
    const body=mode==="new"?{nick,adult,google,token:tok.current,website:hp.current?.value||""}:{nick,code};
    try{
      const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const j=await r.json().catch(()=>({}));
      if(!r.ok){setErr(j.msg||"صار خطأ، حاول مرة أخرى.");setBusy(false);return}
      if(mode==="new"&&!j.google)setDone({nick:j.nick,code:j.code});else location.href="/";
    }catch{setErr("تعذّر الاتصال، تأكد من الإنترنت.");setBusy(false)}
  }
  if(done)return(<div className="space-y-4">
    <h1 className="text-2xl font-bold text-white">مرحبا {done.nick} 🎯</h1>
    <p className="text-mute text-sm leading-7">هذا <b className="text-white">كود الاسترجاع</b> تاعك. يظهر <b className="text-amber">مرة وحدة فقط</b>. صوّرو أو احفظو، لأنو هو الطريقة الوحيدة باش ترجع لحسابك من جهاز آخر.</p>
    <div dir="ltr" className="rounded-xl border border-amber/50 bg-bg text-amber text-center text-2xl font-mono tracking-widest py-4 select-all">{done.code}</div>
    <a href="/" className="btn cta flex items-center justify-center w-full h-12 rounded-xl font-semibold">حفظته، ادخل الأرينا</a></div>);
  const gBtn=gOn&&!google?<><a href="/api/auth/google" className="btn flex items-center justify-center gap-3 w-full h-14 rounded-2xl bg-white text-[#1F1F1F] font-semibold text-[15px] shadow-[0_10px_28px_-12px_rgba(255,255,255,.35)] transition active:scale-[.97] motion-reduce:transform-none hover:brightness-95"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>الدخول بحساب Google</a>
    <div className="flex items-center gap-3 text-xs text-mute"><i className="flex-1 h-px bg-line"/>ولا<i className="flex-1 h-px bg-line"/></div></>:null;
  return(<form onSubmit={go} className="space-y-4">
    {google&&<p className="rounded-xl border border-violet/40 bg-bg text-sm text-white px-4 py-3 leading-6">تحققنا من حسابك في جوجل ✓ اختر اسمك المستعار باش تكمل. ما نخزنو لا إيميلك لا اسمك الحقيقي.</p>}
    {gBtn}
    {!google&&<div className="flex gap-2 p-1 rounded-xl bg-bg border border-line">
      {(["new","back"] as const).map(m=><button type="button" key={m} onClick={()=>{setMode(m);setErr("")}} className={"flex-1 h-11 rounded-lg text-sm font-semibold "+(mode===m?"bg-[var(--surface-2)] text-white shadow-[inset_0_0_0_1px_rgba(255,176,32,.45)]":"text-[#C9CCE0]")}>{m==="new"?"حساب جديد":"عندي حساب"}</button>)}</div>}
    <label className="block text-sm text-mute">الاسم المستعار<input className={inp+" mt-1.5"} value={nick} onChange={e=>setNick(e.target.value)} maxLength={20} autoComplete="username" placeholder="مثلا: خبير_الأحد" required/></label>
    {mode==="back"&&<label className="block text-sm text-mute">كود الاسترجاع<input dir="ltr" className={inp+" mt-1.5 font-mono tracking-widest"} value={code} onChange={e=>setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX" required/></label>}
    {mode==="new"&&<>
      <input ref={hp} name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true"/>
      <label className="flex gap-3 items-start text-sm text-mute leading-6"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)} className="mt-1.5 size-4 accent-violet"/>أؤكد أني بلغت 18 سنة، وأوافق على <a href="/legal" className="text-violet underline">الشروط والخصوصية</a>. الموقع للتوقعات فقط ولا فيه مراهنة.</label>
      {KEY&&<div className="cf-turnstile" data-sitekey={KEY} data-callback="hadafTs"/>}</>}
    {err&&<p role="alert" className="text-pink text-sm">{err}</p>}
    <button disabled={busy||(mode==="new"&&!adult)} className="btn cta w-full h-12 rounded-xl font-semibold disabled:opacity-50">{busy?"لحظة...":mode==="new"?"سجّل وادخل":"ادخل"}</button>
    <p className="text-xs text-mute leading-6">{google?"المرة الجاية تدخل بضغطة وحدة على زر جوجل.":"بلا كلمة سر وبلا إيميل."}</p></form>);
}
