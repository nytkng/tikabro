import AuthForm from "@/components/AuthForm";
export const metadata={title:"الدخول"};
import {googleOn} from "@/lib/google";
export const dynamic="force-dynamic";
export default async function Login({searchParams}:{searchParams:Promise<{g?:string}>}){
  const g=(await searchParams).g;
  const msg=g==="fail"?"تعذّر الدخول بجوجل، حاول مرة أخرى.":g==="off"?"الدخول بجوجل مازال ما تفعّلش.":"";
  return(<section className="mx-auto w-full min-w-0 max-w-md overflow-hidden rounded-[20px] bg-surface border border-line p-6 sm:p-8 mt-6">
   <h1 className="text-2xl font-bold text-white mb-1">ادخل إلى الأرينا</h1>
   <p className="text-mute text-sm leading-7 mb-6">اختر اسما مستعارا وابدأ تختم توقعاتك قبل المباريات.</p>
   <AuthForm google={g==="new"} gOn={googleOn()} gMsg={msg}/></section>);
}
