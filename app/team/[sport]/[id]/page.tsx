import {notFound} from "next/navigation";
import Link from "next/link";
import type {Metadata} from "next";
import {getTeam,validTeam} from "@/lib/team";
import {getLang} from "@/lib/lang";
import {t} from "@/lib/i18n";
import {SITE_URL} from "@/lib/seo";
import Crest from "@/components/Crest";
import MatchRow from "@/components/MatchRow";
import {FormBoxes,Momentum} from "@/components/viz/Viz";
type P={params:Promise<{sport:string;id:string}>};
export async function generateMetadata({params}:P):Promise<Metadata>{
  const {sport,id}=await params;const d=validTeam(sport,id)?await getTeam(sport,id).catch(()=>null):null;
  if(!d)return {metadataBase:new URL(SITE_URL),title:{absolute:"فريق | هدف"},robots:{index:false}};
  const path=`/team/${sport}/${id}`,title=`${d.name} — التصنيف، النتائج والتوقعات | هدف`;
  const description=`${d.name}${d.league?` (${d.league})`:""}: تقييم Elo، الفورمة، آخر النتائج والماتشات الجاية مع توقعات الذكاء الاصطناعي.`;
  return {metadataBase:new URL(SITE_URL),title:{absolute:title},description,alternates:{canonical:path},openGraph:{title,description,url:path}};
}
const H2=({c,children}:{c:string;children:React.ReactNode})=><h2 className="font-display text-xl text-white mb-3 flex items-center gap-2"><i aria-hidden className={"w-1.5 h-5 rounded-full "+c}/>{children}</h2>;
const r1=(x:number)=>(Math.round(x*100)/100).toString();
export default async function TeamPage({params}:P){
  const {sport,id}=await params;if(!validTeam(sport,id))notFound();
  const [d,lang]=await Promise.all([getTeam(sport,id).catch(()=>null),getLang()]);if(!d)notFound();
  const lg=lang==="ar"?d.league:(d.leagueName||d.league);
  return(<div className="flex flex-col gap-5 pb-6">
    <section className="panel p-5 sm:p-6 flex flex-col items-center text-center gap-3">
      <Crest name={d.name} size={80} logo={d.logo}/>
      <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight"><bdi>{d.name}</bdi></h1>
      {lg&&(d.slug?<Link href={`/league/${sport}/${d.slug}`} className="chip text-xs rounded-full border border-line px-3 py-1 text-mute hover:text-white"><bdi>{lg}</bdi></Link>:<span className="text-xs rounded-full border border-line px-3 py-1 text-mute"><bdi>{lg}</bdi></span>)}
      {d.form&&<div className="flex flex-col items-center gap-1"><span className="text-[11px] text-mute">{t(lang,"team.form")}</span><div className="flex gap-2 flex-wrap justify-center"><FormBoxes f={d.form.slice(0,5)} lang={lang} size="md"/>{d.form.length>5&&<FormBoxes f={d.form.slice(5)} lang={lang} size="md"/>}</div></div>}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-2">
        <div className="rounded-xl border border-line bg-white/[.02] p-3"><div className="text-[11px] text-mute">{t(lang,"team.elo")}</div><div className="text-2xl font-bold text-amber tabular-nums">{d.elo??"—"}</div>
          {d.rank&&d.total?<div className="text-[11px] text-mute mt-0.5">{t(lang,"team.rank",{r:d.rank,n:d.total})}</div>:null}</div>
        <div className="rounded-xl border border-line bg-white/[.02] p-3"><div className="text-[11px] text-mute">{t(lang,"team.ai")}</div>
          <div className="text-2xl font-bold text-violet tabular-nums">{d.ai?Math.round(100*d.ai.hits/d.ai.n)+"%":"—"}</div>
          {d.ai&&<div className="text-[11px] text-mute mt-0.5">{t(lang,"team.ai_rec",{h:d.ai.hits,n:d.ai.n})}</div>}</div>
      </div>
      {d.n>0&&<p className="text-xs text-mute">{t(lang,"team.learned",{n:d.n})} · <Link className="underline hover:text-white" href={`/rankings?s=${sport}`}>{t(lang,"team.rankings")}</Link></p>}
    </section>
    {d.wave.length>=3&&<section className="panel p-5 sm:p-6"><H2 c="bg-violet">{t(lang,"team.momentum")}</H2><Momentum res={d.wave} color="violet" name={d.name} lang={lang}/></section>}
    {d.goals&&<section className="panel p-5 sm:p-6"><H2 c="bg-teal">{t(lang,"team.goals")}</H2>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border border-line p-3"><div className="text-[11px] text-mute">{t(lang,"team.gf")}</div><div className="text-xl font-bold text-teal tabular-nums">{r1(d.goals.gf/d.goals.gp)}</div></div>
        <div className="rounded-xl border border-line p-3"><div className="text-[11px] text-mute">{t(lang,"team.ga")}</div><div className="text-xl font-bold text-pink tabular-nums">{r1(d.goals.ga/d.goals.gp)}</div></div>
      </div></section>}
    <section className="panel p-3 sm:p-4"><div className="px-2 pt-2"><H2 c="bg-amber">{t(lang,"team.next")}</H2></div>
      {d.next.length?<div className="flex flex-col">{d.next.map(m=><MatchRow key={m.id} m={m} lang={lang}/>)}</div>:<p className="text-sm text-mute px-2 pb-2">{t(lang,"team.none")}</p>}</section>
    {d.last.length>0&&<section className="panel p-3 sm:p-4"><div className="px-2 pt-2"><H2 c="bg-pink">{t(lang,"team.last")}</H2></div>
      <div className="flex flex-col">{d.last.map(m=><MatchRow key={m.id} m={m} lang={lang}/>)}</div></section>}
  </div>);
}
