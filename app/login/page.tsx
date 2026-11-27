export const metadata={title:"الدخول"};
export default function Login(){
  return(<section className="mx-auto max-w-md rounded-[20px] bg-surface border border-line p-8 mt-6"><h1 className="text-2xl font-bold text-white">ادخل إلى الأرينا</h1>
   <p className="text-mute text-sm leading-7 mt-2 mb-6">بحساب Google. ما نطلب كلمة سر. الموقع للتوقعات فقط وما فيه مراهنة، وللمسجلين من 18 سنة.</p>
   <button disabled className="w-full h-12 rounded-xl bg-white text-bg font-semibold disabled:opacity-60">الدخول بحساب Google · قريبا</button>
   <p className="text-xs text-mute mt-4 leading-6">الدخول يشتغل بعد ما نضيف GOOGLE_CLIENT_ID في الإعدادات.</p></section>);
}
