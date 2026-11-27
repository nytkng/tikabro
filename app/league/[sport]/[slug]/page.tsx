import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {COLS,toMatch,type Row} from "@/lib/feed";
import MatchRow from "@/components/MatchRow";
import {getLang} from "@/lib/lang";
import {t} from "@/lib/i18n";
export const dynamic="force-dynamic";
import {leagueMeta,SITE_URL} from "@/lib/seo";
import type {Metadata} from "next";
export async function generateMetadata({params}:{params:Promise<{sport:string;slug:string}>}):Promise<Metadata>{
  const {sport,slug}=await params;return {metadataBase:new URL(SITE_URL),...leagueMeta(sport,slug)};
}

const SPORTS=["soccer","basketball","hockey","football","baseball"];
type Stat={name?:string;displayValue?:string;value?:number};
type Entry={team?:{displayName?:string;shortDisplayName?:string;logos?:{href?:string}[]};note?:{color?:string;description?:string};stats?:Stat[]};
type Group={name?:string;standings?:{entries?:Entry[]};children?:Group[]};
type Payload={name?:string;logos?:{href?:string}[];children?:Group[];standings?:{entries?:Entry[]}};

async function standings(sport:string,slug:string):Promise<Payload|null>{
  try{const r=await fetch(`https://site.api.espn.com/apis/v2/sports/${sport}/${slug}/standings`,{cache:"no-store"});return r.ok?await r.json():null}catch{return null}
}
// تسطيح المجموعات (مؤتمرات/أقسام) إلى قائمة جداول
function groups(p:Payload):{name:string;entries:Entry[]}[]{
  const out:{name:string;entries:Entry[]}[]=[];
  const walk=(g:Group)=>{if(g.standings?.entries?.length)out.push({name:g.name||"",entries:g.standings.entries});g.children?.forEach(walk)};
  if(p.standings?.entries?.length)out.push({name:"",entries:p.standings.entries});
  p.children?.forEach(walk);return out;
}
const st=(e:Entry,n:string)=>e.stats?.find(s=>s.name===n);
const dv=(e:Entry,n:string)=>st(e,n)?.displayValue||"-";

export default async function LeaguePage({params,searchParams}:{params:Promise<{sport:string;slug:string}>;searchParams:Promise<{t?:string}>}){
  const {sport,slug}=await params;const lang=await getLang();const T=(k:Parameters<typeof t>[1],v?:Record<string,string|number>)=>t(lang,k,v);const tab=(await searchParams).t==="m"?"m":"s";
  if(!SPORTS.includes(sport)||!/^[a-z0-9._-]+$/i.test(slug))notFound();
  const now=Date.now(),from=new Date(now-3*864e5).toISOString(),to=new Date(now+7*864e5).toISOString();
  const [p,lg,rows]=await Promise.all([
    standings(sport,slug),
    db<{name:string|null;logo:string|null}[]>(`leagues?slug=eq.${encodeURIComponent(slug)}&select=name,logo&limit=1`).catch(()=>null),
    db<Row[]>(`matches?slug=eq.${encodeURIComponent(slug)}&sport=eq.${sport}&kickoff=gte.${encodeURIComponent(from)}&kickoff=lt.${encodeURIComponent(to)}&select=${COLS}&order=kickoff.asc&limit=200`).catch(()=>null),
  ]);
  const ms=(rows||[]).map(toMatch);
  const past=ms.filter(m=>m.state!=="pre").reverse(),next=ms.filter(m=>m.state==="pre");
  const name=lg?.[0]?.name||p?.name||rows?.[0]?.league_name||slug;
  const logo=lg?.[0]?.logo||p?.logos?.[0]?.href||rows?.[0]?.league_logo||null;
  const soccer=sport==="soccer";
  const tables=p?groups(p):[];
  const cols=soccer?[["gamesPlayed",T("lg.played")],["wins",T("lg.won")],["ties",T("lg.tied")],["losses",T("lg.lost")],["pointDifferential",T("lg.diff")],["points",T("lg.pts")]]
    :[["wins","W"],["losses","L"],["winPercent","PCT"],["gamesBehind","GB"]];
  const sortKey=soccer?"rank":"playoffSeed";
  const legend=new Map<string,string>();
  tables.forEach(t=>t.entries.forEach(e=>{if(e.note?.color&&e.note.description)legend.set(e.note.description,e.note.color)}));

  // الفورمة: آخر 5 نتائج لكل فريق من المباريات اللي عندنا
  const form=new Map<string,("W"|"D"|"L")[]>();
  for(const m of [...past].reverse())if(m.state==="post"&&m.score){const [h,a]=m.score;
    const add=(t:string,r:"W"|"D"|"L")=>{const f=form.get(t)||[];f.push(r);form.set(t,f.slice(-5))};
    add(m.home,h>a?"W":h<a?"L":"D");add(m.away,a>h?"W":a<h?"L":"D")}
  const fc={W:[T("lg.f.w"),"bg-teal/20 text-[#9FE5DA]",T("lg.won_l")],D:[T("lg.f.d"),"bg-white/10 text-[#C9CCE0]",T("lg.tied_l")],L:[T("lg.f.l"),"bg-pink/15 text-pink",T("lg.lost_l")]} as const;
  const base=`/league/${sport}/${slug}`;
  return(<main className="max-w-4xl mx-auto w-full py-4 flex flex-col gap-5">
    <header className="stage relative overflow-hidden rounded-[22px] p-5 sm:p-7">
      <div className="relative flex items-center gap-4">
        <span className="crest grid place-items-center rounded-2xl size-[76px] shrink-0">{logo?<img src={logo} alt="" width={56} height={56} referrerPolicy="no-referrer" className="w-14 h-14 object-contain"/>:<span className="font-display text-3xl text-amber">{[...name][0]}</span>}</span>
        <div className="min-w-0"><p className="text-xs text-mute">{T("lg.kicker")}</p><h1 className="font-display text-[28px] sm:text-4xl leading-tight text-white"><bdi>{name}</bdi></h1>
          <p className="text-xs text-[#C9CCE0] mt-1">{T("lg.counts",{n:next.length,p:past.length})}</p></div>
      </div>
    </header>
    <nav className="seg sticky top-[60px] z-20" aria-label={T("lg.sections")}>
      {([["s",T("lg.standings")],["m",T("lg.matches")]] as const).map(([k,l])=><a key={k} href={k==="s"?base:base+"?t=m"} aria-current={tab===k?"page":undefined} className={"flex-1 h-11 rounded-[10px] grid place-items-center text-sm "+(tab===k?"bg-[var(--surface-2)] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,176,32,.45)]":"text-[#C9CCE0] hover:bg-hover")}>{l}</a>)}
    </nav>

    {tab==="s"&&<section className="panel p-3 sm:p-4 flex flex-col gap-4">
      {!tables.length&&<p className="text-mute text-sm p-2">{T("lg.no_table")}</p>}
      {tables.map((t,i)=>{
        const es=[...t.entries].sort((a,b)=>(st(a,sortKey)?.value??999)-(st(b,sortKey)?.value??999));
        return(<div key={i} className="flex flex-col gap-2">
          {t.name&&tables.length>1&&<h3 className="text-sm text-amber font-semibold px-1"><bdi>{t.name}</bdi></h3>}
          <div className="overflow-auto max-h-[75vh] rounded-xl scroll-x">
            <table className="w-full min-w-[520px] text-sm tabular-nums border-separate border-spacing-0">
              <thead className="sticky top-0 z-10"><tr className="text-mute text-xs bg-[#0F1320]"><th className="py-2.5 px-1 text-center w-9 sticky start-0 bg-[#0F1320]">#</th><th className="py-2.5 px-2 text-start sticky start-9 bg-[#0F1320]">{T("lg.team")}</th>
                {cols.map(([k,l])=><th key={k} className="py-2.5 px-2 text-center">{l}</th>)}{form.size>0&&<th className="py-2.5 px-2 text-center">{T("lg.form")}</th>}</tr></thead>
              <tbody>{es.map((e,j)=>{const tn=e.team?.displayName||e.team?.shortDisplayName||"";const f=form.get(tn)||form.get(e.team?.shortDisplayName||"");
                return(<tr key={j} className="hover:bg-white/[.03]">
                <td className="py-2.5 px-1 text-center border-t border-line sticky start-0 bg-[#10141F]" style={e.note?.color?{boxShadow:`inset ${lang==="ar"?-4:4}px 0 0 ${e.note.color}`}:undefined}><b className={j<3?"text-white":"text-[#C9CCE0]"}>{j+1}</b></td>
                <td className="py-2.5 px-2 border-t border-line sticky start-9 bg-[#10141F]"><span className="flex items-center gap-2 min-w-0 max-w-[150px] sm:max-w-none">
                  {e.team?.logos?.[0]?.href?<img src={e.team.logos[0].href} alt="" width={22} height={22} loading="lazy" referrerPolicy="no-referrer" className="w-[22px] h-[22px] object-contain shrink-0"/>:null}
                  <bdi className="truncate text-white">{tn}</bdi></span></td>
                {cols.map(([k])=><td key={k} className={"py-2.5 px-2 text-center border-t border-line "+(k==="points"?"font-bold text-white":"text-[#C9CCE0]")}><bdi dir="ltr">{dv(e,k)}</bdi></td>)}
                {form.size>0&&<td className="py-2.5 px-2 border-t border-line"><span className="flex gap-1 justify-center">{(f||[]).map((r,x)=><i key={x} title={fc[r][2]} aria-label={fc[r][2]} className={"not-italic w-[22px] h-[22px] rounded-md grid place-items-center text-[11px] font-semibold "+fc[r][1]}>{fc[r][0]}</i>)}{!f&&<span className="text-mute">-</span>}</span></td>}
              </tr>)})}</tbody>
            </table>
          </div>
        </div>)})}
      {legend.size>0&&<ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#C9CCE0] px-1 pb-1">{[...legend].map(([d,c])=><li key={d} className="flex items-center gap-1.5"><i className="w-1 h-4 rounded-full inline-block" style={{background:c}}/><bdi>{d}</bdi></li>)}</ul>}
    </section>}

    {tab==="m"&&<>
    <section className="panel p-2 sm:p-3">
      <h2 className="font-display text-xl text-white px-2 pt-2 mb-1 flex items-center gap-2"><i aria-hidden className="w-1.5 h-5 rounded-full bg-amber"/>{T("lg.next")}</h2>
      {next.length?next.map(m=><MatchRow key={m.id} m={m} lang={lang}/>):<p className="text-mute text-sm p-2">{T("lg.no_next")}</p>}
    </section>
    <section className="panel p-2 sm:p-3">
      <h2 className="font-display text-xl text-white px-2 pt-2 mb-1 flex items-center gap-2"><i aria-hidden className="w-1.5 h-5 rounded-full bg-teal"/>{T("lg.recent")}</h2>
      {past.length?past.map(m=><MatchRow key={m.id} m={m} lang={lang}/>):<p className="text-mute text-sm p-2">{T("lg.no_recent")}</p>}
    </section></>}
  </main>);
}
