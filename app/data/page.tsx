// البيانات المفتوحة: أول مجموعة بيانات عربية مفتوحة لتوقعات رياضية مختومة.
import {FIELDS,LICENSE,todayDZ,addDays} from "@/lib/opendata";
export const dynamic="force-dynamic";
export const metadata={title:"البيانات المفتوحة",description:"توقعات الـ AI المختومة تاع هدف، مفتوحة للجميع تحت رخصة CC BY 4.0."};
const DESC:Record<(typeof FIELDS)[number],string>={match_id:"رقم المباراة (ثابت)",league:"رمز الدوري",kickoff:"وقت البداية (ISO، UTC)",home:"الفريق المستقبل",away:"الفريق الضيف",
 p_home:"احتمال فوز المستقبل (0–1)",p_draw:"احتمال التعادل (فارغ إذا ما كاينش تعادل)",p_away:"احتمال فوز الضيف (0–1)",pick:"اختيار الـ AI: home / draw / away",model_version:"نسخة النموذج اللي ختمت التوقع",
 sealed_at:"وقت الختم (قبل البداية ديما)",outcome:"النتيجة بعد الحسم",hit:"صاب ولا لا",brier:"Brier (أقل = أحسن)"};
const card="rounded-2xl bg-card border border-line p-5";
export default function Data(){
  const t=todayDZ();
  const dl=(n:number)=>`/api/v1/predictions.csv?from=${addDays(t,-(n-1))}&to=${t}`;
  return(<div className="flex flex-col gap-6">
   <section className={card}>
    <span className="text-xs text-violet font-semibold">API v1 · {LICENSE}</span>
    <h1 className="text-3xl font-bold text-white mt-1">البيانات المفتوحة</h1>
    <p className="text-mute mt-3 leading-7">أول مجموعة بيانات عربية مفتوحة لتوقعات الرياضة: كل توقع تاع الـ AI مختوم قبل البداية، وبعد النهاية نزيدو النتيجة وBrier. ما نبدلو والو من بعد، وما فيها حتى معلومة على المستخدمين.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
     <a href={dl(7)} className="rounded-xl bg-violet/15 border border-violet/40 text-white text-center py-3 font-semibold hover:bg-violet/25">تنزيل CSV · آخر 7 أيام</a>
     <a href={dl(30)} className="rounded-xl bg-white/5 border border-line text-white text-center py-3 font-semibold hover:bg-white/10">تنزيل CSV · آخر 30 يوم</a>
    </div>
   </section>
   <section className={card}>
    <h2 className="text-lg font-semibold text-white mb-3">كيفاش تستعملها</h2>
    <p className="text-sm text-mute mb-2">JSON ليوم واحد (افتراضيا اليوم بتوقيت الجزائر، أقصى 1000 سطر):</p>
    <pre dir="ltr" className="text-left text-xs bg-black/40 rounded-xl p-4 overflow-x-auto text-white/90">curl "https://hadaf.app/api/v1/predictions?date={t}"</pre>
    <p className="text-sm text-mute mt-4 mb-2">CSV لمدة (أقصى 31 يوم):</p>
    <pre dir="ltr" className="text-left text-xs bg-black/40 rounded-xl p-4 overflow-x-auto text-white/90">curl -o hadaf.csv "https://hadaf.app/api/v1/predictions.csv?from={addDays(t,-6)}&to={t}"</pre>
    <ul className="text-sm text-mute mt-4 leading-7 list-disc ps-5 marker:text-violet">
     <li>الردود مخزنة 5 دقايق (Cache-Control) ومفتوحة لأي موقع (CORS).</li>
     <li>حد الطلبات: 60 طلب في الدقيقة لكل عنوان. إذا تعديتو تاخذ 429.</li>
     <li>أي باراميتر غلط يرجع 400 مع سبب واضح.</li>
    </ul>
   </section>
   <section className={card}>
    <h2 className="text-lg font-semibold text-white mb-3">الحقول</h2>
    <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>
     {FIELDS.map(f=><tr key={f} className="border-t border-line first:border-0"><td dir="ltr" className="py-2.5 pe-4 font-mono text-violet whitespace-nowrap text-right">{f}</td><td className="py-2.5 text-mute">{DESC[f]}</td></tr>)}
    </tbody></table></div>
   </section>
   <section className={card}>
    <h2 className="text-lg font-semibold text-white mb-2">الرخصة</h2>
    <p className="text-sm text-mute leading-7">البيانات تحت رخصة <a className="text-violet underline" href="https://creativecommons.org/licenses/by/4.0/deed.ar" rel="license noopener">{LICENSE}</a>: استعملها، حللها، وانشرها حتى تجاريا، بشرط تذكر المصدر: <b className="text-white">HADAF (هدف)</b>. التوقعات تحليل برك، ماشي نصيحة رهان.</p>
   </section>
  </div>);
}
