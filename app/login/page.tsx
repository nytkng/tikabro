import AuthForm from "@/components/AuthForm";
export const metadata={title:"الدخول"};
export default function Login(){
  return(<section className="mx-auto max-w-md rounded-[20px] bg-surface border border-line p-6 sm:p-8 mt-6">
   <h1 className="text-2xl font-bold text-white mb-1">ادخل إلى الأرينا</h1>
   <p className="text-mute text-sm leading-7 mb-6">اختر اسما مستعارا وابدأ تختم توقعاتك قبل المباريات.</p>
   <AuthForm/></section>);
}
