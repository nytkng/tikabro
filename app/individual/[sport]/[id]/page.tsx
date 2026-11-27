import Link from "next/link";
import {notFound} from "next/navigation";
import {IND_LABEL,belongsTo,tourLabel,getIndEvent,isIndSport,type IndPlayer,type TennisMatch} from "@/lib/individual";

export const dynamic="force-dynamic";

const fmt=(s?:string|null)=>s?new Date(s).toLocaleString("ar-DZ",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"}):"";
const Flag=({src}:{src?:string})=>src?<img src={src} alt="" width={20} height={14} className="h-3.5 w-5 rounded-sm object-cover" referrerPolicy="no-referrer" loading="lazy"/>:<span className="inline-block w-5"/>;
const stateLabel=(s?:string|null)=>s==="in"?<span className="text-pink-300">مباشر</span>:s==="post"?<span className="text-mute">انتهت</span>:null;

function PlayerRow({p}:{p?:IndPlayer|null}){
  return (
    <div className={`flex items-center gap-2 ${p?.won?"font-bold text-white":"text-mute"}`}>
      <Flag src={p?.flag}/><bdi className="flex-1 truncate">{p?.name??"—"}</bdi>
      <span className="flex gap-2 tabular-nums">{(p?.sets??[]).map((s,i)=><span key={i} className="w-5 text-center">{s.v??""}{s.tb!=null&&<sup className="text-[10px]">{s.tb}</sup>}</span>)}</span>
    </div>
  );
}

function Tennis({matches}:{matches:TennisMatch[]}){
  const groups=new Map<string,TennisMatch[]>();
  for(const m of matches){const k=[m.draw,m.round!==m.draw?m.round:null].filter(Boolean).join(" · ")||"—";(groups.get(k)??groups.set(k,[]).get(k)!).push(m)}
  return <>{[...groups].map(([k,ms])=>(
    <section key={k} className="mb-4">
      <h2 className="font-display mb-2 text-violet-300">الجولة: <bdi>{k}</bdi></h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {ms.map((m,i)=>(
          <div key={i} className="rounded-2xl bg-card border border-line p-3 text-sm space-y-1">
            <PlayerRow p={m.p1}/><PlayerRow p={m.p2}/>
            <div className="flex justify-between text-xs text-mute"><bdi>{m.detail}</bdi>{stateLabel(m.state)}</div>
          </div>
        ))}
      </div>
    </section>
  ))}</>;
}

export default async function Page({params}:{params:Promise<{sport:string;id:string}>}){
  const {sport,id}=await params;
  if(!isIndSport(sport))notFound();
  const e=await getIndEvent(decodeURIComponent(id));
  if(!e||!belongsTo(sport,e.sport))notFound();
  const p=e.payload??{};
  const empty=<div className="rounded-2xl bg-card border border-line p-6 text-center text-mute">ماكانش معطيات بعد — راجع قريب.</div>;
  return (
    <main className="mx-auto max-w-4xl p-4" dir="rtl">
      <Link href={`/individual/${sport}`} className="text-sm text-mute">← {IND_LABEL[sport]}</Link>
      <header className="my-4 flex items-center gap-3">
        {e.event_logo&&<img src={e.event_logo} alt="" width={48} height={48} className="h-12 w-12 object-contain" referrerPolicy="no-referrer" loading="lazy"/>}
        <div>
          <h1 className="font-display text-2xl text-white"><bdi>{e.event_name}</bdi></h1>
          <div className="text-sm text-mute tabular-nums">{tourLabel(e.tour)} · {fmt(e.start)} {stateLabel(e.state)}</div>
        </div>
      </header>

      {sport==="tennis"&&((p.matches?.length??0)>0?<Tennis matches={p.matches!}/>:empty)}

      {sport==="golf"&&((p.board?.length??0)>0?(
        <div className="rounded-2xl bg-card border border-line overflow-hidden">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-mute"><tr><th className="p-2 text-right">الترتيب</th><th className="p-2 text-right">اللاعب</th><th className="p-2 text-left">النتيجة</th></tr></thead>
            <tbody>{p.board!.map((r,i)=>(
              <tr key={i} className="border-t border-line">
                <td className={`p-2 ${i<3?"text-amber-300":"text-mute"}`}>{r.pos}</td>
                <td className="p-2 text-white"><span className="flex items-center gap-2"><Flag src={r.flag}/><bdi>{r.name}</bdi></span></td>
                <td className="p-2 text-left text-white" dir="ltr">{r.score}</td>
              </tr>))}</tbody>
          </table>
        </div>):empty)}

      {(e.sport==="f1"||e.sport==="racing")&&<>
        <h2 className="font-display mb-2 text-violet-300">الجلسات</h2>
        {(p.sessions?.length??0)>0?(
          <ol className="mb-6 space-y-2 border-r-2 border-violet-500/40 pr-4">
            {p.sessions!.map((s,i)=>(
              <li key={i} className="rounded-2xl bg-card border border-line p-3 flex justify-between text-sm">
                <bdi className="text-white">{s.name}</bdi><span className="text-mute tabular-nums">{fmt(s.start)} {stateLabel(s.state)}</span>
              </li>))}
          </ol>):empty}
        <h2 className="font-display mb-2 text-pink-300">النتائج {p.session_of_results&&<bdi className="text-sm text-mute">({p.session_of_results})</bdi>}</h2>
        {(p.results?.length??0)>0?(
          <div className="rounded-2xl bg-card border border-line divide-y divide-line">
            {p.results!.map((r,i)=>(
              <div key={i} className={`flex items-center gap-3 p-2 text-sm ${r.won?"font-bold text-white":"text-mute"}`}>
                <span className={`w-6 tabular-nums ${i<3?"text-amber-300":""}`}>{r.pos}</span><Flag src={r.flag}/><bdi>{r.name}</bdi>
              </div>))}
          </div>):empty}
      </>}

      {sport==="ufc"&&((p.fights?.length??0)>0?(
        <div className="space-y-2">
          {p.fights!.map((f,i)=>(
            <div key={i} className="rounded-2xl bg-card border border-line p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className={`flex items-center gap-2 ${f.a?.won?"font-bold text-white":"text-mute"}`}><Flag src={f.a?.flag}/><bdi>{f.a?.name??"—"}</bdi></span>
                <span className="text-amber-300 text-xs">ضد</span>
                <span className={`flex items-center gap-2 ${f.b?.won?"font-bold text-white":"text-mute"}`}><bdi>{f.b?.name??"—"}</bdi><Flag src={f.b?.flag}/></span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-mute"><bdi>{f.cls}</bdi><span><bdi>{f.detail}</bdi> {stateLabel(f.state)}</span></div>
            </div>))}
        </div>):empty)}
    </main>
  );
}
