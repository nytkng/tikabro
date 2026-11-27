import {currentPlayer} from "@/lib/auth";
const nav=[["المباريات","/"],["الترتيب","/leaders"],["سجل الـ AI","/ai"],["الباقات","/pricing"]];
export default async function Header(){
  const me=await currentPlayer();
  return(<header className="sticky top-0 z-30 border-b border-line bg-[#0B0D14]/90 backdrop-blur">
   <div className="mx-auto max-w-[1320px] flex items-center gap-4 px-3 sm:px-6 h-16">
    <a href="/" className="flex items-baseline gap-1 shrink-0"><span className="font-display text-[34px] leading-none text-white">هدف</span><i className="inline-block w-2.5 h-2.5 rounded-full bg-amber"/></a>
    <nav className="hidden md:flex gap-1 flex-1">{nav.map(([t,h])=><a key={h} href={h} className="px-3.5 py-2 rounded-lg text-[15px] text-[#C9CCE0] hover:text-white hover:bg-white/5">{t}</a>)}</nav>
    <div className="flex-1 md:hidden"/>
    {me?<form action="/api/logout" method="post" className="flex items-center gap-2"><a href={`/u/${encodeURIComponent(me.nick)}`} className="flex items-center gap-2 rounded-full bg-card border border-line ps-1.5 pe-3 h-10 text-white text-sm font-semibold hover:border-violet/60"><span className="w-7 h-7 rounded-full bg-violet text-bg grid place-items-center text-xs font-bold">{[...me.nick][0]}</span>{me.nick}</a><button className="text-mute text-xs hover:text-white px-2">خروج</button></form>
    :<a href="/login" className="btn inline-flex items-center px-5 rounded-xl bg-white text-[#0B0D14] font-semibold text-sm">دخول</a>}
   </div>
   <nav className="md:hidden flex gap-1 px-3 pb-2 overflow-x-auto scroll-x">{nav.map(([t,h])=><a key={h} href={h} className="shrink-0 px-3 py-1.5 rounded-lg text-sm text-[#C9CCE0]">{t}</a>)}</nav>
  </header>);
}
