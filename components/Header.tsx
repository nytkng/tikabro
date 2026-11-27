import {Suspense} from "react";
import {currentPlayer} from "@/lib/auth";
import LivePill from "@/components/ui/LivePill";
const nav=[["المباريات","/"],["الترتيب","/leaders"],["دوريات الأصحاب","/groups"],["سجل الـ AI","/ai"],["تصنيف الفرق","/rankings"],["الباقات","/pricing"]];
export default async function Header(){
  const me=await currentPlayer();
  return(<header className="hdr sticky top-0 z-30">
   <div className="mx-auto max-w-[1320px] flex items-center gap-3 px-3 sm:px-6 h-14 sm:h-16">
    <a href="/" aria-label="هدف، الصفحة الرئيسية" className="flex items-center gap-2 shrink-0 min-h-11">
     <span className="seal-mark grid place-items-center w-8 h-8 rounded-full font-display text-[15px] leading-none">ه</span>
     <span className="font-display text-[30px] leading-none text-white">هدف</span>
    </a>
    <nav aria-label="القائمة" className="hidden md:flex gap-0.5 flex-1 ms-4">{nav.map(([t,h])=><a key={h} href={h} className="navlink px-3 h-10 inline-flex items-center rounded-lg text-[14px] text-[#BCC1D6] hover:text-white">{t}</a>)}</nav>
    <div className="flex-1 md:hidden"/>
    <Suspense fallback={null}><LivePill/></Suspense>
    {me?<form action="/api/logout" method="post" className="flex items-center gap-1">
      <a href={`/u/${encodeURIComponent(me.nick)}`} className="flex items-center gap-2 rounded-full bg-[#121726] border border-line ps-1 pe-3 h-10 text-white text-sm font-semibold hover:border-amber/50 max-w-[160px]"><span className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-pink text-[#0B0D14] grid place-items-center text-xs font-bold shrink-0">{[...me.nick][0]}</span><span className="truncate"><bdi>{me.nick}</bdi></span></a>
      <button className="text-mute text-xs hover:text-white px-2 rounded-lg">خروج</button></form>
    :<a href="/login" className="btn inline-flex items-center px-5 rounded-xl bg-amber text-[#1A1206] font-semibold text-sm hover:brightness-110">دخول</a>}
   </div>
   <nav aria-label="القائمة" className="md:hidden flex gap-1 px-3 pb-2 overflow-x-auto scroll-x">{nav.map(([t,h])=><a key={h} href={h} className="shrink-0 px-3 h-9 inline-flex items-center rounded-full text-[13px] text-[#BCC1D6] bg-white/[0.03] border border-white/5">{t}</a>)}</nav>
  </header>);
}
