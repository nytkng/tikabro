"use client";
// عدّاد تنازلي لصافرة البداية. يتحسب بعد التحميل باش ما يكونش اختلاف بين السيرفر والمتصفح.
import {useEffect,useState} from "react";
import {t,type Lang} from "@/lib/i18n";
const pad=(n:number)=>String(n).padStart(2,"0");
export default function Countdown({to,className="",lang="ar"}:{to:string;className?:string;lang?:Lang}){
  const [left,setLeft]=useState<number|null>(null);
  useEffect(()=>{const t0=Date.parse(to);const tick=()=>setLeft(Math.max(0,t0-Date.now()));tick();const i=setInterval(tick,1000);return()=>clearInterval(i)},[to]);
  if(left===null)return <span className={className} aria-hidden>--:--:--</span>;
  if(left===0)return <span className={className}>{t(lang,"whistle_soon")}</span>;
  const s=Math.floor(left/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60);
  return <span className={className} dir="ltr" role="timer" aria-label={t(lang,"left_aria",{h,m})}>{h>99?"99+":pad(h)}:{pad(m)}:{pad(s%60)}</span>;
}
