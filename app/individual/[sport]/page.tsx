import Link from "next/link";
import {notFound} from "next/navigation";
import {IND_LABEL,IND_SPORTS,indCalendar,isIndSport,listIndEvents} from "@/lib/individual";

export const dynamic="force-dynamic";

const fmt=(s?:string|null)=>s?new Date(s).toLocaleDateString("ar-DZ",{day:"numeric",month:"long",timeZone:"Africa/Algiers"}):"";
const fmtDT=(s?:string|null)=>s?new Date(s).toLocaleString("ar-DZ",{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Africa/Algiers"}):"";
function stateOf(e:{start:string|null;end_date:string|null;state:string|null}){
  const now=Date.now(),st=e.start?Date.parse(e.start):NaN;
  let en=e.end_date?Date.parse(e.end_date):NaN;
  if(e.end_date&&/^\d{4}-\d{2}-\d{2}$/.test(e.end_date))en+=86400000-1;
  if(isNaN(st))return e.state;
  if(isNaN(en))en=st+86400000;
  if(st<=now&&now<=en)return "in";
  if(en<now)return "post";
  return "pre";
}
function Badge({state}:{state:string|null}){
  if(state==="in")return <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-xs text-pink-300">جارية</span>;
  if(state==="post")return <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-mute">انتهت</span>;
  return <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">قادمة</span>;
}

export default async function Page({params}:{params:Promise<{sport:string}>}){
  const {sport}=await params;
  if(!isIndSport(sport))notFound();
  const [events,cal]=await Promise.all([listIndEvents(sport),indCalendar(sport)]);
  const list=events??[];
  const next=(cal??[]).flatMap(c=>c.next.map(n=>({...n,tour:c.tour}))).sort((a,b)=>(a.start??"").localeCompare(b.start??"")).slice(0,6);
  return (
    <main className="mx-auto max-w-4xl p-4" dir="rtl">
      <nav className="mb-4 flex gap-2 overflow-x-auto">
        {IND_SPORTS.map(s=><Link key={s} href={`/individual/${s}`} className={`whitespace-nowrap rounded-2xl border border-line px-3 py-1.5 text-sm ${s===sport?"bg-violet-600 text-white":"bg-card text-mute"}`}>{IND_LABEL[s]}</Link>)}
      </nav>
      <h1 className="font-display mb-4 text-2xl text-white">{IND_LABEL[sport]}</h1>
      {list.length===0?(
        <div className="rounded-2xl bg-card border border-line p-6 text-center">
          <p className="text-white">ماكانش منافسات هاد الأيام — الموسم متوقف حاليا.</p>
          {next.length>0?(
            <ul className="mt-4 space-y-2 text-sm">
              {next.map((n,i)=><li key={i} className="flex justify-between text-mute"><bdi className="text-white">{n.name}</bdi><span className="tabular-nums text-amber-300">{fmt(n.start)}</span></li>)}
            </ul>
          ):<p className="mt-2 text-sm text-mute">المواعيد الجاية ما تنشرتش بعد.</p>}
        </div>
      ):(
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map(e=>(
            <Link key={e.id} href={`/individual/${sport}/${encodeURIComponent(e.id)}`} className="rounded-2xl bg-card border border-line p-4 hover:border-violet-500">
              <div className="flex items-center gap-3">
                {e.event_logo&&<img src={e.event_logo} alt="" width={36} height={36} className="h-9 w-9 object-contain" referrerPolicy="no-referrer" loading="lazy"/>}
                <div className="min-w-0 flex-1">
                  <div className="font-display truncate text-white border-b border-line/60 pb-1 mb-1"><bdi>{e.event_name}</bdi></div>
                  <div className="text-xs text-mute tabular-nums">{e.tour?<>{e.tour.toUpperCase()}<span aria-hidden="true" className="mx-1.5 opacity-50">|</span></>:null}{fmt(e.start)}{e.end_date&&e.end_date!==e.start?` – ${fmt(e.end_date)}`:""}</div>
                </div>
                <Badge state={stateOf(e)}/>
              </div>
              {e.start&&<div className="mt-2 text-xs text-mute tabular-nums">{fmtDT(e.start)} <span className="opacity-70">بتوقيت الجزائر</span></div>}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
