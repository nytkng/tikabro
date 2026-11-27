// البحث على الفرق والمباريات: من جدول المباريات تاعنا، بلا خدمة خارجية.
export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import {COLS,toMatch,type Row} from "@/lib/feed";
import {getLang} from "@/lib/lang";
import {t} from "@/lib/i18n";
import Crest from "@/components/Crest";
import MatchRow from "@/components/MatchRow";
type R=Row&{home_id:string|null;away_id:string|null};
export async function generateMetadata(){return {title:t(await getLang(),"s.title"),robots:{index:false}}}
export default async function Search({searchParams}:{searchParams:Promise<{q?:string}>}){
  const lang=await getLang();const q=((await searchParams).q||"").replace(/[^\p{L}\p{N} .'-]/gu,"").trim().slice(0,40);
  let teams:{sport:string;id:string;name:string;logo:string|null;league:string|null;n:number}[]=[];let up:R[]=[];
  if(q.length>=2){
    const pat=encodeURIComponent(`*${q}*`);
    const rows=(await db<R[]>(`matches?or=(home.ilike.${pat},away.ilike.${pat})&select=${COLS},home_id,away_id&order=kickoff.desc&limit=300`))||[];
    const m=new Map<string,(typeof teams)[number]>();const ql=q.toLowerCase();
    for(const r of rows)for(const s of [0,1] as const){const nm=s?r.away:r.home,id=s?r.away_id:r.home_id;if(!id||!nm?.toLowerCase().includes(ql))continue;
      const k=r.sport+":"+id;const x=m.get(k);if(x)x.n++;else m.set(k,{sport:r.sport,id,name:nm,logo:s?r.away_logo:r.home_logo,league:r.league_name,n:1})}
    teams=[...m.values()].sort((a,b)=>b.n-a.n).slice(0,24);
    const now=Date.now()-3*3600e3;up=rows.filter(r=>new Date(r.kickoff).getTime()>now).sort((a,b)=>a.kickoff.localeCompare(b.kickoff)).slice(0,20);
  }
  return(<div className="max-w-3xl mx-auto flex flex-col gap-5">
    <h1 className="font-display text-3xl text-white">{t(lang,"s.title")}</h1>
    <form action="/search" role="search" className="flex gap-2">
      <input name="q" defaultValue={q} autoFocus minLength={2} maxLength={40} placeholder={t(lang,"s.ph")} aria-label={t(lang,"s.ph")} className="flex-1 h-12 rounded-xl bg-s2 border border-line px-4 text-white placeholder:text-mute focus:outline-none focus:border-violet"/>
      <button className="h-12 px-5 rounded-xl bg-white text-[#0B0E13] font-semibold">{t(lang,"s.go")}</button></form>
    {q.length>=2&&!teams.length&&<p className="panel p-5 text-sm text-mute leading-7">{t(lang,"s.none",{q})}</p>}
    {teams.length>0&&<section><h2 className="text-lg font-semibold text-white mb-3">{t(lang,"s.teams")}</h2>
     <ul className="grid sm:grid-cols-2 gap-2">{teams.map(x=><li key={x.sport+x.id}><a href={`/team/${x.sport}/${x.id}`} className="panel flex items-center gap-3 p-3 hover:border-[#3A4352]">
      <Crest name={x.name} logo={x.logo} size={36}/><span className="min-w-0 flex-1"><bdi className="block truncate text-white font-semibold">{x.name}</bdi><bdi className="block truncate text-xs text-mute">{x.league||x.sport}</bdi></span></a></li>)}</ul></section>}
    {up.length>0&&<section><h2 className="text-lg font-semibold text-white mb-3">{t(lang,"s.next")}</h2>
     <div className="panel p-1.5 flex flex-col">{up.map(r=><MatchRow key={r.id} m={toMatch(r)} lang={lang}/>)}</div></section>}
  </div>);
}
