// تصنيف الفرق حسب Elo، لكل رياضة. أحسن 300 تقييم، ثم البطولات/الشعارات من المباريات، ثم فرز رجال/سيدات/جامعات.
export const dynamic="force-dynamic";
import Link from "next/link";
import {db} from "@/lib/db";
import Crest from "@/components/Crest";
import {arLeague} from "@/lib/arabic";
export const metadata={title:"تصنيف الفرق"};
const SPORTS:[string,string][]=[["soccer","كرة القدم"],["basketball","كرة السلة"],["hockey","الهوكي"],["football","كرة أمريكية"],["baseball","البيسبول"],["rugby","الرغبي"]];
const TABS:[string,string][]=[["men","الرجال"],["women","السيدات"],["college","الجامعات"],["all","الكل"]];
type T={key:string;team:string;elo:number;n:number};
type M={home_id:string|number|null;away_id:string|number|null;slug:string|null;league_name:string|null;home_logo:string|null;away_logo:string|null};
type Info={slug?:string;league?:string;logo?:string;tags:string};
const WOMEN=/women|feminine|w\b|\.w\.|wsl|nwsl|liga.f|frauen|d1.arkema|womens/i,COLLEGE=/ncaa|college/i,YOUTH=/u17|u19|u20|u21|u23|youth/i;
export default async function Rankings({searchParams}:{searchParams:Promise<{s?:string;t?:string}>}){
  const sp=await searchParams;const s=SPORTS.some(([k])=>k===sp.s)?sp.s!:"soccer";const t=TABS.some(([k])=>k===sp.t)?sp.t!:"men";
  const rows=(await db<T[]>(`team_ratings?sport=eq.${s}&n=gte.5&select=key,team,elo,n&order=elo.desc&limit=300`))||[];
  const idOf=(k:string)=>k.slice(k.indexOf(":")+1);
  const ids=[...new Set(rows.map(r=>idOf(r.key)).filter(Boolean))];
  const info=new Map<string,Info>();
  const add=(id:string|number|null,x:M,logo:string|null)=>{if(id==null)return;const k=String(id);if(!ids.includes(k))return;
    const c=info.get(k)||{tags:""};c.tags+=" "+(x.slug||"")+" "+(x.league_name||"");
    if(!c.slug&&x.slug){c.slug=x.slug;c.league=x.league_name||undefined}if(!c.logo&&logo)c.logo=logo;info.set(k,c)};
  const CH=110;const chunks:string[][]=[];for(let i=0;i<ids.length;i+=CH)chunks.push(ids.slice(i,i+CH));
  const res=await Promise.all(chunks.map(c=>{const list=encodeURIComponent(c.map(i=>`"${i.replace(/"/g,"")}"`).join(","));
    return db<M[]>(`matches?sport=eq.${s}&or=(home_id.in.(${list}),away_id.in.(${list}))&select=home_id,away_id,slug,league_name,home_logo,away_logo&order=kickoff.desc&limit=1500`)}));
  for(const m of res)for(const x of m||[]){add(x.home_id,x,x.home_logo);add(x.away_id,x,x.away_logo)}
  const kind=(id:string)=>{const g=info.get(id)?.tags||"";return WOMEN.test(g)?"women":COLLEGE.test(g)?"college":YOUTH.test(g)?"youth":"men"};
  const list=rows.filter(r=>t==="all"||kind(idOf(r.key))===t).slice(0,100);
  const href=(k:string,tab:string)=>`/rankings?s=${k}${tab!=="men"?`&t=${tab}`:""}`;
  const pill=(on:boolean)=>"px-3 py-1.5 rounded-full text-sm border "+(on?"bg-violet text-bg border-violet":"border-line text-mute hover:text-white");
  return(<div className="flex flex-col gap-6">
   <section className="rounded-2xl bg-card border border-line p-5">
    <h1 className="text-3xl font-bold text-white">تصنيف الفرق</h1>
    <p className="text-mute mt-2 leading-7">تقييم <bdi>Elo</bdi> رقم يطلع كي يربح الفريق ويهبط كي يخسر، وكل ما كان الخصم أقوى كل ما كانت الحركة أكبر.</p>
    <nav className="flex flex-wrap gap-2 mt-4" aria-label="الرياضات">{SPORTS.map(([k,l])=><Link key={k} href={href(k,t)} aria-current={k===s?"page":undefined} className={pill(k===s)}>{l}</Link>)}</nav>
    <nav className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line" aria-label="الفئة">{TABS.map(([k,l])=><Link key={k} href={href(s,k)} aria-current={k===t?"page":undefined}
      className={"px-3 py-1 rounded-full text-xs border "+(k===t?"border-amber text-amber":"border-line text-mute hover:text-white")}>{l}</Link>)}</nav>
   </section>
   <section className="rounded-2xl bg-card border border-line p-5">
    {list.length===0?<p className="text-mute">مازال ما كاينش فرق بـ 5 مباريات متعلّمة على الأقل في هذي الفئة.</p>:
    <table className="w-full text-sm tabular-nums"><thead><tr className="text-mute"><th className="font-normal pb-2 text-right w-10">#</th><th className="font-normal pb-2 text-right">الفريق</th><th className="font-normal pb-2 text-right">Elo</th><th className="font-normal pb-2 text-right">مباريات متعلّمة</th></tr></thead>
    <tbody>{list.map((r,i)=>{const f=info.get(idOf(r.key));const lg=arLeague(f?.slug,f?.league);return <tr key={r.key} className="border-t border-line">
      <td className={"py-2.5 font-display text-lg "+(i<3?"text-amber":"text-mute")} dir="ltr">{i+1}</td>
      <td><span className="flex items-center gap-2"><Crest name={r.team||"?"} logo={f?.logo} size={24}/><span className="flex flex-col items-start gap-0.5"><bdi className="text-white">{r.team}</bdi>
        {lg&&<span className="text-[11px] leading-4 px-2 rounded-full border border-line text-mute">{lg}</span>}</span></span></td>
      <td dir="ltr" className="text-right font-display text-lg text-violet">{Math.round(r.elo)}</td>
      <td dir="ltr" className="text-right text-mute">{r.n}</td></tr>})}</tbody></table>}
   </section>
  </div>);
}
