"use client";
// شريط النتيجة الصغير: يبان في التليفون كي يفوت المسرح من الشاشة.
import {useEffect,useState,type ReactNode} from "react";
export default function StickyScore({children}:{children:ReactNode}){
  const [on,setOn]=useState(false);
  useEffect(()=>{const el=document.getElementById("stage");if(!el)return;
    const o=new IntersectionObserver(([e])=>setOn(!e.isIntersecting),{rootMargin:"-60px 0px 0px 0px"});o.observe(el);return()=>o.disconnect()},[]);
  return <div aria-hidden={!on} className={"sm:hidden fixed inset-x-0 top-0 z-40 hdr transition-transform duration-200 "+(on?"translate-y-0":"-translate-y-full")}>{children}</div>;
}
