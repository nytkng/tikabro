"use client";
// عدد المباريات المباشرة في الصفحة الحالية، يبان في الهيدر بلا طلب زايد للسيرفر.
import {useEffect,useState} from "react";
import {usePathname,useSearchParams} from "next/navigation";
export default function LivePill({label="مباشر"}:{label?:string}){
  const [n,setN]=useState(0);const path=usePathname();const sp=useSearchParams();
  useEffect(()=>{const c=()=>setN(Number(document.querySelector("[data-live-count]")?.getAttribute("data-live-count")||0));c();const o=new MutationObserver(c);o.observe(document.body,{subtree:true,attributes:true,attributeFilter:["data-live-count"],childList:true});return()=>o.disconnect()},[path,sp]);
  if(!n)return null;
  return <a href="/?live=1" className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-full bg-pink/10 border border-pink/30 text-pink text-[13px] font-semibold hover:bg-pink/15"><i className="live-dot !mb-0"/>{label} <b className="tabular-nums">{n}</b></a>;
}
