// سجل تطوير الـ AI: ملاحظات إصدار صادقة لكل نسخة من النموذج.
import {releasesFor} from "@/lib/opendata";
import {getLang} from "@/lib/lang";
import {t} from "@/lib/i18n";
export async function generateMetadata(){const l=await getLang();return {title:t(l,"cl.title"),description:t(l,"cl.desc")}}
const BADGE={current:["cl.current","bg-violet/20 text-violet border-violet/40"],retired:["cl.retired","bg-white/5 text-mute border-line"],planned:["cl.planned","bg-amber/15 text-amber border-amber/40"]} as const;
export default async function Changelog(){
  const lang=await getLang();
  return(<div className="flex flex-col gap-6">
   <section className="rounded-2xl bg-card border border-line p-5">
    <h1 className="text-3xl font-bold text-white">{t(lang,"cl.title")}</h1>
    <p className="text-mute mt-2 leading-7">{t(lang,"cl.intro")}</p>
   </section>
   <ol className="relative flex flex-col gap-5 border-s border-line ms-3 ps-5">
    {releasesFor(lang).map(r=>{const [lbk,cl]=BADGE[r.status];const lb=t(lang,lbk);return(<li key={r.version} className="relative">
     <span className={"absolute -start-[27px] top-6 size-3 rounded-full "+(r.status==="current"?"bg-violet shadow-[0_0_12px_#8B7CFF]":r.status==="planned"?"bg-amber":"bg-line")}/>
     <article className="rounded-2xl bg-card border border-line p-5">
      <div className="flex flex-wrap items-center gap-2"><code dir="ltr" className="text-sm text-white font-mono">{r.version}</code><span className={"text-xs rounded-full border px-2 py-0.5 "+cl}>{lb}</span><span dir="ltr" className="text-xs text-mute ms-auto tabular-nums">{r.date}</span></div>
      <h2 className="text-lg font-semibold text-white mt-2">{r.name}</h2>
      <p className="text-sm text-mute mt-1 leading-7">{r.summary}</p>
      <h3 className="text-sm font-semibold text-white mt-4">{t(lang,"cl.what")}</h3>
      <ul className="text-sm text-mute mt-1 leading-7 list-disc ps-5 marker:text-violet">{r.changes.map(c=><li key={c}>{c}</li>)}</ul>
      <h3 className="text-sm font-semibold text-white mt-3">{t(lang,"cl.why")}</h3>
      <p className="text-sm text-mute mt-1 leading-7">{r.why}</p>
     </article></li>)})}
   </ol>
  </div>);
}
