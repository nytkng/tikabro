import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {COLS,toMatch,type Row} from "@/lib/feed";
import MatchRow from "@/components/MatchRow";
export const dynamic="force-dynamic";

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

export default async function LeaguePage({params}:{params:Promise<{sport:string;slug:string}>}){
  const {sport,slug}=await params;
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
  const cols=soccer?[["gamesPlayed","لعب"],["wins","فاز"],["ties","تعادل"],["losses","خسر"],["pointDifferential","الفارق"],["points","النقاط"]]
    :[["wins","W"],["losses","L"],["winPercent","PCT"],["gamesBehind","GB"]];
  const sortKey=soccer?"rank":"playoffSeed";
  const legend=new Map<string,string>();
  tables.forEach(t=>t.entries.forEach(e=>{if(e.note?.color&&e.note.description)legend.set(e.note.description,e.note.color)}));

  return(<main className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
    <header className="flex items-center gap-4">
      {logo?<img src={logo} alt="" width={56} height={56} className="w-14 h-14 object-contain"/>:null}
      <h1 className="font-display text-2xl sm:text-3xl text-white">{name}</h1>
    </header>

    <section className="rounded-2xl bg-card border border-line p-4 flex flex-col gap-4">
      <h2 className="font-display text-lg text-white">الترتيب</h2>
      {!tables.length&&<p className="text-mute text-sm">الترتيب غير متوفر حاليا.</p>}
      {tables.map((t,i)=>{
        const es=[...t.entries].sort((a,b)=>(st(a,sortKey)?.value??999)-(st(b,sortKey)?.value??999));
        return(<div key={i} className="flex flex-col gap-2">
          {t.name&&tables.length>1&&<h3 className="text-sm text-mute font-semibold">{t.name}</h3>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm tabular-nums">
              <thead><tr className="text-mute text-xs"><th className="py-2 px-1 text-center w-8">#</th><th className="py-2 px-2 text-start">الفريق</th>
                {cols.map(([k,l])=><th key={k} className="py-2 px-2 text-center">{l}</th>)}</tr></thead>
              <tbody>{es.map((e,j)=>(<tr key={j} className="border-t border-line">
                <td className="py-2 px-1 text-center" style={e.note?.color?{boxShadow:`inset -3px 0 0 ${e.note.color}`}:undefined}>{j+1}</td>
                <td className="py-2 px-2"><span className="flex items-center gap-2 min-w-0">
                  {e.team?.logos?.[0]?.href?<img src={e.team.logos[0].href} alt="" width={22} height={22} loading="lazy" className="w-[22px] h-[22px] object-contain shrink-0"/>:null}
                  <span className="truncate text-white">{e.team?.displayName||e.team?.shortDisplayName}</span></span></td>
                {cols.map(([k])=><td key={k} className={"py-2 px-2 text-center "+(k==="points"?"font-bold text-white":"text-[#C9CCE0]")}><bdi dir="ltr">{dv(e,k)}</bdi></td>)}
              </tr>))}</tbody>
            </table>
          </div>
        </div>)})}
      {legend.size>0&&<ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">{[...legend].map(([d,c])=><li key={d} className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:c}}/>{d}</li>)}</ul>}
    </section>

    <section className="rounded-2xl bg-card border border-line p-4">
      <h2 className="font-display text-lg text-white mb-2">النتائج الأخيرة</h2>
      {past.length?past.map(m=><MatchRow key={m.id} m={m}/>):<p className="text-mute text-sm">لا توجد نتائج في آخر 3 أيام.</p>}
    </section>
    <section className="rounded-2xl bg-card border border-line p-4">
      <h2 className="font-display text-lg text-white mb-2">المباريات القادمة</h2>
      {next.length?next.map(m=><MatchRow key={m.id} m={m}/>):<p className="text-mute text-sm">لا توجد مباريات في الأيام السبعة القادمة.</p>}
    </section>
  </main>);
}
