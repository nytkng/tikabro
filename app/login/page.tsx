import AuthForm from "@/components/AuthForm";
import Seal from "@/components/ui/Seal";
export const metadata={title:"الدخول"};
import {googleOn} from "@/lib/google";
import {getLang} from "@/lib/lang";
import {t} from "@/lib/i18n";
export const dynamic="force-dynamic";
export default async function Login({searchParams}:{searchParams:Promise<{g?:string}>}){
  const g=(await searchParams).g;const lang=await getLang();
  const msg=g==="fail"?t(lang,"l.gfail"):g==="off"?t(lang,"l.goff"):"";
  return(<section className="mx-auto w-full min-w-0 max-w-3xl mt-4 grid md:grid-cols-[1fr_1.1fr] overflow-hidden rounded-[22px] border border-[var(--edge)]">
   <div className="stage relative overflow-hidden p-6 sm:p-8 !border-0 !rounded-none">
    <div className="relative flex flex-col gap-4">
     <Seal size={64} className="seal">{t(lang,"brand")}</Seal>
     <h1 className="font-display text-[32px] leading-tight text-white">{t(lang,"l.title")}</h1>
     <p className="text-[#C9CCE0] text-sm leading-7">{t(lang,"l.p")}</p>
     <ul className="hidden md:flex flex-col gap-2 text-sm text-[#C9CCE0] mt-2">{[t(lang,"l.b1"),t(lang,"l.b2"),t(lang,"l.b3")].map(t=><li key={t} className="flex gap-2"><b className="text-amber">✓</b>{t}</li>)}</ul>
    </div></div>
   <div className="panel !rounded-none !border-0 p-6 sm:p-8 min-w-0"><AuthForm google={g==="new"} gOn={googleOn()} gMsg={msg} lang={lang}/></div>
  </section>);
}
