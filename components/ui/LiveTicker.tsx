"use client";
// شريط المباشر: يتحرك وحدو كل 4 ثواني، يحبس كي تحط يدك عليه، وما يتحركش إذا المستعمل طالب حركة قليلة.
import {useEffect,useRef,type ReactNode} from "react";
export default function LiveTicker({children}:{children:ReactNode}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    let hold=false;const on=()=>{hold=true},off=()=>{hold=false};
    el.addEventListener("pointerenter",on);el.addEventListener("pointerleave",off);el.addEventListener("focusin",on);el.addEventListener("focusout",off);el.addEventListener("touchstart",on,{passive:true});
    const i=setInterval(()=>{
      if(hold||document.visibilityState!=="visible")return;
      const card=el.firstElementChild as HTMLElement|null;const step=(card?.offsetWidth||260)+10;
      const end=Math.abs(el.scrollLeft)+el.clientWidth>=el.scrollWidth-6;
      if(end)el.scrollTo({left:0,behavior:"smooth"});else el.scrollBy({left:-step,behavior:"smooth"});
    },4000);
    return()=>{clearInterval(i);el.removeEventListener("pointerenter",on);el.removeEventListener("pointerleave",off);el.removeEventListener("focusin",on);el.removeEventListener("focusout",off);el.removeEventListener("touchstart",on)};
  },[]);
  return <div ref={ref} className="ticker flex gap-2.5 overflow-x-auto scroll-x snap-x snap-mandatory pb-1" role="list">{children}</div>;
}
