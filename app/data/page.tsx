// البيانات المفتوحة: أول مجموعة بيانات عربية مفتوحة لتوقعات رياضية مختومة.
import {FIELDS,LICENSE,todayDZ,addDays} from "@/lib/opendata";
import {getLang} from "@/lib/lang";
import {t as tr} from "@/lib/i18n";
export const dynamic="force-dynamic";
export async function generateMetadata(){const l=await getLang();return {title:tr(l,"od.title"),description:tr(l,"od.desc")}}

const card="rounded-2xl bg-card border border-line p-5";
export default async function Data(){
  const lang=await getLang();const T=(k:Parameters<typeof tr>[1])=>tr(lang,k);
  const t=todayDZ();
  const dl=(n:number)=>`/api/v1/predictions.csv?from=${addDays(t,-(n-1))}&to=${t}`;
  return(<div className="flex flex-col gap-6">
   <section className={card}>
    <span className="text-xs text-violet font-semibold">API v1 · {LICENSE}</span>
    <h1 className="text-3xl font-bold text-white mt-1">{T("od.title")}</h1>
    <p className="text-mute mt-3 leading-7">{T("od.intro")}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
     <a href={dl(7)} className="rounded-xl bg-violet/15 border border-violet/40 text-white text-center py-3 font-semibold hover:bg-violet/25">{T("od.dl7")}</a>
     <a href={dl(30)} className="rounded-xl bg-white/5 border border-line text-white text-center py-3 font-semibold hover:bg-white/10">{T("od.dl30")}</a>
    </div>
   </section>
   <section className={card}>
    <h2 className="text-lg font-semibold text-white mb-3">{T("od.how")}</h2>
    <p className="text-sm text-mute mb-2">{T("od.json")}</p>
    <pre dir="ltr" className="text-left text-xs bg-black/40 rounded-xl p-4 overflow-x-auto text-white/90">curl "https://hadaf.app/api/v1/predictions?date={t}"</pre>
    <p className="text-sm text-mute mt-4 mb-2">{T("od.csv")}</p>
    <pre dir="ltr" className="text-left text-xs bg-black/40 rounded-xl p-4 overflow-x-auto text-white/90">curl -o hadaf.csv "https://hadaf.app/api/v1/predictions.csv?from={addDays(t,-6)}&to={t}"</pre>
    <ul className="text-sm text-mute mt-4 leading-7 list-disc ps-5 marker:text-violet">
     <li>{T("od.b1")}</li>
     <li>{T("od.b2")}</li>
     <li>{T("od.b3")}</li>
    </ul>
   </section>
   <section className={card}>
    <h2 className="text-lg font-semibold text-white mb-3">{T("od.fields")}</h2>
    <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>
     {FIELDS.map(f=><tr key={f} className="border-t border-line first:border-0"><td dir="ltr" className="py-2.5 pe-4 font-mono text-violet whitespace-nowrap text-start">{f}</td><td className="py-2.5 text-mute">{T(`od.f.${f}` as const)}</td></tr>)}
    </tbody></table></div>
   </section>
   <section className={card}>
    <h2 className="text-lg font-semibold text-white mb-2">{T("od.license")}</h2>
    <p className="text-sm text-mute leading-7">{T("od.lic_a")} <a className="text-violet underline" href={`https://creativecommons.org/licenses/by/4.0/deed.${lang}`} rel="license noopener">{LICENSE}</a>{T("od.lic_b")} <b className="text-white">HADAF (هدف)</b>. {T("od.lic_c")}</p>
   </section>
  </div>);
}
