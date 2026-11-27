const plans=[
 {n:"فضية",p:"مجانية",c:"#9AA1B5",f:["توقعات الـ AI لكل المباريات","اختم توقعاتك وتابع نسبة صحتك","الترتيب العام والأوسمة"]},
 {n:"ذهبية",p:"[--]",c:"#FFB020",f:["كل مزايا الفضية","تحليل أعمق: الأهداف المتوقعة وأكثر/أقل","إشعارات مخصصة لفرقك","بلا إعلانات"],hot:true},
 {n:"ماسية",p:"[--]",c:"#8B7CFF",f:["كل مزايا الذهبية","سجل كامل للتوقعات وتصديره","دوريات خاصة مع أصدقائك","أولوية في الميزات الجديدة"]}];
export const metadata={title:"الباقات"};
export default function Pricing(){
  return(<><h1 className="text-3xl font-bold text-white">الباقات</h1><p className="text-mute mt-2 mb-8 leading-7 max-w-xl">المزايا الإضافية في التحليل والعرض فقط. لا باقة تضمن نتائج، والموقع للتوقعات بلا مراهنة.</p>
  <div className="grid gap-5 md:grid-cols-3">{plans.map(p=><section key={p.n} className="rounded-2xl bg-card border p-7 flex flex-col" style={{borderColor:p.hot?p.c:"#1E2436"}}>
   <h2 className="text-xl font-semibold" style={{color:p.c}}>{p.n}</h2><div className="text-3xl font-bold text-white my-3">{p.p}</div>
   <ul className="text-[15px] leading-8 text-[#C9CCE0] flex-1 list-disc ps-5">{p.f.map(x=><li key={x}>{x}</li>)}</ul>
   <button disabled={p.n!=="فضية"} className="mt-6 h-12 rounded-xl font-semibold disabled:opacity-50" style={{background:p.c,color:"#0B0D14"}}>{p.n==="فضية"?"ابدأ مجانا":"قريبا"}</button></section>)}</div></>);
}
