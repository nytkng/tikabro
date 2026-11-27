"use client";
import {useEffect,useState} from "react";
const KEY="hadaf_install_dismissed";
export default function InstallPrompt(){
  const [evt,setEvt]=useState<any>(null);const [ios,setIos]=useState(false);
  useEffect(()=>{
    if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
    let dismissed=false;try{dismissed=localStorage.getItem(KEY)==="1"}catch{}
    if(dismissed)return;
    const standalone=window.matchMedia?.("(display-mode: standalone)").matches||(navigator as any).standalone;
    if(standalone)return;
    const ua=navigator.userAgent;
    if(/iphone|ipad|ipod/i.test(ua)&&/safari/i.test(ua)&&!/crios|fxios|edgios/i.test(ua))setIos(true);
    const h=(e:Event)=>{e.preventDefault();setEvt(e)};
    window.addEventListener("beforeinstallprompt",h);
    return()=>window.removeEventListener("beforeinstallprompt",h);
  },[]);
  const close=()=>{setEvt(null);setIos(false);try{localStorage.setItem(KEY,"1")}catch{}};
  if(!evt&&!ios)return null;
  return(<div className="fixed bottom-3 inset-x-3 z-50 mx-auto max-w-md rounded-xl border border-amber-500/40 bg-[#0B0D14] p-3 text-sm text-white shadow-lg flex items-center gap-2">
    {evt?<button className="flex-1 rounded-lg bg-amber-500 px-3 py-2 font-bold text-black" onClick={async()=>{try{await evt.prompt();await evt.userChoice}catch{}close()}}>ثبّت هدف على هاتفك</button>
    :<p className="flex-1 leading-6">باش تثبّت هدف: اضغط زر «مشاركة» ⬆️ ومن بعد «إضافة إلى الشاشة الرئيسية».</p>}
    <button aria-label="إغلاق" className="px-2 text-lg text-white/60" onClick={close}>×</button>
  </div>);
}
