// تصنيف الفرق حسب Elo، لكل رياضة. استعلامين خفاف: أحسن 50 تقييم، ثم الشعارات.
export const dynamic="force-dynamic";
import Link from "next/link";
import {db} from "@/lib/db";
import Crest from "@/components/Crest";
export const metadata={title:"تصنيف الفرق"};
const SPORTS:[string,string][]=[["soccer","كرة القدم"],["basketball","كرة السلة"],["hockey","الهوكي"],["football","كرة أمريكية"],["baseball","البيسبول"],["rugby","الرغبي"]];
type T={key:string;team:string;elo:number;n:number};
export default async function Rankings({searchParams}:{searchParams:Promise<{s?:string}>}){
  const q=(await searchParams).s;const s=SPORTS.some(([k])=>k===q)?q!:"soccer";
  const rows=(await db<T[]>(`team_ratings?sport=eq.${s}&n=gte.5&select=key,team,elo,n&order=elo.desc&limit=50`))||[];
  const idOf=(k:string)=>k.slice(k.indexOf(":")+1);
  const ids=rows.map(r=>idOf(r.key)).filter(Boolean);
  const logos=new Map<string,string>();
  if(ids.length){
    const list=ids.map(i=>`"${i.replace(/"/g,"")}"`).join(",");
    const m=(await db<{home_id:string|number;home_logo:string|null}[]>(`matches?sport=eq.${s}&home_id=in.(${encodeURIComponent(list)})&home_logo=not.is.null&select=home_id,home_logo&order=kickoff.desc&limit=300`))||[];
    for(const x of m){const k=String(x.home_id);if(!logos.has(k)&&x.home_logo)logos.set(k,x.home_logo)}
  }
  return(<div className="flex flex-col gap-6">
   <section className="rounded-2xl bg-card border border-line p-5">
    <h1 className="text-3xl font-bold text-white">تصنيف الفرق</h1>
    <p className="text-mute mt-2 leading-7">تقييم <bdi>Elo</bdi> رقم يطلع كي يربح الفريق ويهبط كي يخسر، وكل ما كان الخصم أقوى كل ما كانت الحركة أكبر.</p>
    <nav className="flex flex-wrap gap-2 mt-4" aria-label="الرياضات">{SPORTS.map(([k,l])=><Link key={k} href={`/rankings?s=${k}`} aria-current={k===s?"page":undefined}
      className={"px-3 py-1.5 rounded-full text-sm border "+(k===s?"bg-violet text-bg border-violet":"border-line text-mute hover:text-white")}>{l}</Link>)}</nav>
   </section>
   <section className="rounded-2xl bg-card border border-line p-5">
    {rows.length===0?<p className="text-mute">مازال ما كاينش فرق بـ 5 مباريات متعلّمة على الأقل في هذي الرياضة.</p>:
    <table className="w-full text-sm tabular-nums"><thead><tr className="text-mute"><th className="font-normal pb-2 text-right w-10">#</th><th className="font-normal pb-2 text-right">الفريق</th><th className="font-normal pb-2 text-right">Elo</th><th className="font-normal pb-2 text-right">مباريات متعلّمة</th></tr></thead>
    <tbody>{rows.map((r,i)=><tr key={r.key} className="border-t border-line">
      <td className={"py-2.5 font-display text-lg "+(i<3?"text-amber":"text-mute")} dir="ltr">{i+1}</td>
      <td><span className="flex items-center gap-2"><Crest name={r.team||"?"} logo={logos.get(idOf(r.key))} size={24}/><bdi className="text-white">{r.team}</bdi></span></td>
      <td dir="ltr" className="text-right font-display text-lg text-violet">{Math.round(r.elo)}</td>
      <td dir="ltr" className="text-right text-mute">{r.n}</td></tr>)}</tbody></table>}
   </section>
  </div>);
}
