"use client";
import {useState} from "react";
export default function CopyButton({text,label="انسخ"}:{text:string;label?:string}){
  const [ok,setOk]=useState(false);
  return <button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(text);setOk(true);setTimeout(()=>setOk(false),2000)}catch{}}} className="min-h-11 px-4 rounded-xl bg-violet text-white font-semibold">{ok?"تنسخ ✓":label}</button>;
}
