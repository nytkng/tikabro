"use client";
// زر 🔔: تابع المباراة وتجيك إشعارات الأهداف والنهاية. مجاني، بلا حساب.
import {useEffect,useState} from "react";
import {VAPID_PUBLIC} from "@/lib/push";
import {t,type Lang} from "@/lib/i18n";
const KEY="hadaf_follow";
const u8=(s:string)=>{const p="=".repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(b,c=>c.charCodeAt(0))};
const get=():string[]=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}};
export default function FollowMatch({id,mkey,lang}:{id:string;mkey:string;lang:Lang}){
  const [ok,setOk]=useState(false),[on,setOn]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  useEffect(()=>{setOk("serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window);setOn(get().includes(id))},[id]);
  if(!ok)return null;
  async function go(){
    setBusy(true);setMsg("");
    try{
      if(Notification.permission!=="granted"&&(await Notification.requestPermission())!=="granted"){setMsg(t(lang,"fl.denied"));return}
      const reg=await navigator.serviceWorker.register("/sw.js");await navigator.serviceWorker.ready;
      const sub=(await reg.pushManager.getSubscription())||(await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8(VAPID_PUBLIC)}));
      const r=await fetch("/api/push/sub",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sub:sub.toJSON(),match:id,key:mkey,off:on})});
      if(!r.ok){setMsg(t(lang,"fl.err"));return}
      const L=get().filter(x=>x!==id);if(!on)L.push(id);try{localStorage.setItem(KEY,JSON.stringify(L.slice(-50)))}catch{}
      setOn(!on);
    }catch{setMsg(t(lang,"fl.err"))}finally{setBusy(false)}
  }
  return <span className="inline-flex items-center gap-2"><button type="button" onClick={go} disabled={busy} aria-pressed={on} className={"chip "+(on?"on":"hover:text-white hover:bg-hover")}>{on?"🔔 "+t(lang,"fl.on"):"🔕 "+t(lang,"fl.off")}</button>{msg&&<span className="text-xs text-loss">{msg}</span>}</span>;
}
