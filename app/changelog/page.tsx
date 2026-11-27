// سجل تطوير الـ AI: ملاحظات إصدار صادقة لكل نسخة من النموذج.
import {RELEASES} from "@/lib/opendata";
export const metadata={title:"سجل تطوير الـ AI",description:"واش تبدل في كل نسخة من نموذج هدف، وعلاش."};
const BADGE={current:["الحالية","bg-violet/20 text-violet border-violet/40"],retired:["متقاعدة","bg-white/5 text-mute border-line"],planned:["مخططة","bg-amber/15 text-amber border-amber/40"]} as const;
export default function Changelog(){
  return(<div className="flex flex-col gap-6">
   <section className="rounded-2xl bg-card border border-line p-5">
    <h1 className="text-3xl font-bold text-white">سجل تطوير الـ AI</h1>
    <p className="text-mute mt-2 leading-7">كل نسخة من النموذج، واش تبدل فيها وعلاش. التوقعات القديمة تبقى مختومة باسم النسخة اللي دارتها، باش المقارنة تبقى صادقة.</p>
   </section>
   <ol className="relative flex flex-col gap-5 border-s border-line ms-3 ps-5">
    {RELEASES.map(r=>{const [lb,cl]=BADGE[r.status];return(<li key={r.version} className="relative">
     <span className={"absolute -start-[27px] top-6 size-3 rounded-full "+(r.status==="current"?"bg-violet shadow-[0_0_12px_#8B7CFF]":r.status==="planned"?"bg-amber":"bg-line")}/>
     <article className="rounded-2xl bg-card border border-line p-5">
      <div className="flex flex-wrap items-center gap-2"><code dir="ltr" className="text-sm text-white font-mono">{r.version}</code><span className={"text-xs rounded-full border px-2 py-0.5 "+cl}>{lb}</span><span dir="ltr" className="text-xs text-mute ms-auto tabular-nums">{r.date}</span></div>
      <h2 className="text-lg font-semibold text-white mt-2">{r.name}</h2>
      <p className="text-sm text-mute mt-1 leading-7">{r.summary}</p>
      <h3 className="text-sm font-semibold text-white mt-4">واش تبدل</h3>
      <ul className="text-sm text-mute mt-1 leading-7 list-disc ps-5 marker:text-violet">{r.changes.map(c=><li key={c}>{c}</li>)}</ul>
      <h3 className="text-sm font-semibold text-white mt-3">علاش</h3>
      <p className="text-sm text-mute mt-1 leading-7">{r.why}</p>
     </article></li>)})}
   </ol>
  </div>);
}
