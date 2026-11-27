"use client";
// إعادة حساب البصمة في المتصفح: sha256(prev_hash|payload) لازم تساوي entry_hash
import {useEffect,useState} from "react";
export default function Recompute({prev,payload,hash,labels}:{prev:string;payload:string;hash:string;labels:{calc:string;ok:string;bad:string}}){
  const [h,setH]=useState<string|null>(null);
  useEffect(()=>{(async()=>{
    const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(prev+"|"+payload));
    setH([...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join(""));
  })()},[prev,payload]);
  if(!h)return <p className="text-sm opacity-70">…</p>;
  const ok=h===hash;
  return <div className={`rounded-lg p-3 text-sm ${ok?"bg-green-500/15":"bg-red-500/15"}`}>
    <div className="opacity-70">{labels.calc}</div>
    <code dir="ltr" className="block break-all text-xs">{h}</code>
    <div className="mt-1 font-bold">{ok?"✅ "+labels.ok:"❌ "+labels.bad}</div>
  </div>;
}
