import {currentPlayer} from "@/lib/auth";
const nav=[["الأرينا","/"],["الترتيب","/leaders"],["الباقات","/pricing"]];
export default async function Header(){
  const me=await currentPlayer();
  return(<header className="flex flex-wrap items-center justify-between sm:justify-start gap-x-5 gap-y-2 px-4 sm:px-10 py-3 border-b border-line">
   <a href="/" className="text-[26px] font-bold text-white">هدف<span className="text-violet">.</span></a>
   <nav className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 flex gap-1.5 overflow-x-auto">{nav.map(([t,h])=><a key={h} href={h} className="px-3.5 py-2.5 text-[15px] text-[#C9CCE0] hover:text-white">{t}</a>)}</nav>
   {me?<form action="/api/logout" method="post" className="flex items-center gap-3"><a href={`/u/${encodeURIComponent(me.nick)}`} className="text-white font-semibold text-[15px] hover:text-violet">{me.nick}</a><button className="text-mute text-sm hover:text-white">خروج</button></form>
   :<a href="/login" className="btn inline-flex items-center px-5 rounded-xl bg-violet text-bg font-semibold text-[15px]">دخول</a>}</header>);
}
