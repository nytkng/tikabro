"use client";
import {useState} from "react";
import {t,type Lang} from "@/lib/i18n";
export default function CopyButton({text,label,lang="ar"}:{text:string;label?:string;lang?:Lang}){
  const [ok,setOk]=useState(false);
  return <button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(text);setOk(true);setTimeout(()=>setOk(false),2000)}catch{}}} className="min-h-11 px-4 rounded-xl bg-violet text-white font-semibold">{ok?t(lang,"cr.copied"):label??t(lang,"cr.copy")}</button>;
}
