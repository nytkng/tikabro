"use client";
// كي تكون مباريات مباشرة، نحدّث الصفحة كل دقيقة بلا ما يضغط المستعمل.
import {useEffect} from "react";
import {useRouter} from "next/navigation";
export default function LiveRefresh({on,every=60}:{on:boolean;every?:number}){
  const r=useRouter();
  useEffect(()=>{if(!on)return;const t=setInterval(()=>{if(document.visibilityState==="visible")r.refresh()},every*1000);return()=>clearInterval(t)},[on,every,r]);
  return null;
}
