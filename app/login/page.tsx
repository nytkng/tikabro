import AuthForm from "@/components/AuthForm";
import Seal from "@/components/ui/Seal";
export const metadata={title:"الدخول"};
import {googleOn} from "@/lib/google";
export const dynamic="force-dynamic";
export default async function Login({searchParams}:{searchParams:Promise<{g?:string}>}){
  const g=(await searchParams).g;
  const msg=g==="fail"?"تعذّر الدخول بجوجل، حاول مرة أخرى.":g==="off"?"الدخول بجوجل مازال ما تفعّلش.":"";
  return(<section className="mx-auto w-full min-w-0 max-w-3xl mt-4 grid md:grid-cols-[1fr_1.1fr] overflow-hidden rounded-[22px] border border-[var(--edge)]">
   <div className="stage relative overflow-hidden p-6 sm:p-8 !border-0 !rounded-none">
    <div className="relative flex flex-col gap-4">
     <Seal size={64} className="seal">هدف</Seal>
     <h1 className="font-display text-[32px] leading-tight text-white">ادخل للأرينا</h1>
     <p className="text-[#C9CCE0] text-sm leading-7">اختار اسم مستعار وابدا تختم توقعاتك قبل الصافرة، وشوف إذا تغلب الـ AI.</p>
     <ul className="hidden md:flex flex-col gap-2 text-sm text-[#C9CCE0] mt-2">{["توقعك يتختم بالوقت، ما يتبدّلش من بعد","نجوم تتحسب من النتائج برك","بلا مراهنة وبلا دراهم"].map(t=><li key={t} className="flex gap-2"><b className="text-amber">✓</b>{t}</li>)}</ul>
    </div></div>
   <div className="panel !rounded-none !border-0 p-6 sm:p-8 min-w-0"><AuthForm google={g==="new"} gOn={googleOn()} gMsg={msg}/></div>
  </section>);
}
