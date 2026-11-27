export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import {starsOf} from "@/lib/stars";
type P={id:string;nick:string;created_at:string;bio:string|null;hue:number|null;is_test:boolean|null};
type S={n:number;hits:number;ai_hits:number;open:number;points:number;ai_points:number;days:number};
type C={match_id:string;league:string;kickoff:string;pick:"home"|"draw"|"away";hit:boolean|null;points:number|null;settled:boolean};
export async function generateMetadata({params}:{params:Promise<{nick:string}>}){return {title:decodeURIComponent((await params).nick)}}
const post=(b:object)=>({method:"POST",body:JSON.stringify(b)});
export default async function Profile({params}:{params:Promise<{nick:string}>}){
  const nick=decodeURIComponent((await params).nick);
  const p=(await db<P[]>(`players?nick=eq.${encodeURIComponent(nick)}&select=id,nick,created_at,bio,hue&limit=1`))?.[0];
  if(!p)return <div className="text-mute py-20 text-center">هذا اللاعب غير موجود. <a className="underline" href="/leaders">الترتيب</a></div>;
  const [st,calls]=await Promise.all([
    db<S[]>("rpc/player_stats",post({p_player:p.id})),
    db<C[]>("rpc/profile_calls",post({p_player:p.id,p_limit:30})),
  ]);
  const s=st?.[0]??{n:0,hits:0,ai_hits:0,open:0,points:0,ai_points:0,days:0};
  // أسماء الفرق من ESPN (جدول predictions ما فيه أسماء). نأخذ آخر 8 فقط ونخبّيها ساعة.
  const nm=new Map<string,{home:string;away:string}>();
  await Promise.all((calls||[]).slice(0,8).map(async c=>{
    if(!/^\d{3,12}$/.test(c.match_id)||!/^[a-z0-9.]+$/i.test(c.league))return;
    const sport=c.league==="nba"?"basketball":"soccer";
    try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${c.league}/summary?event=${c.match_id}`,{next:{revalidate:3600}});
      if(!r.ok)return;const cp=(await r.json())?.header?.competitions?.[0]?.competitors||[];
      const h=cp.find((x:any)=>x.homeAway==="home")?.team?.displayName,a=cp.find((x:any)=>x.homeAway==="away")?.team?.displayName;
      if(h&&a)nm.set(c.match_id,{home:h,away:a});}catch{}
  }));
  const stars=starsOf(s.hits,s.n),rate=s.n?Math.round(s.hits/s.n*100):null;
  const lab=(c:C)=>{const m=nm.get(c.match_id);const w=c.pick==="home"?(m?`فوز ${m.home}`:"فوز الأرض"):c.pick==="away"?(m?`فوز ${m.away}`:"فوز الضيف"):"تعادل";return w};
  const col=p.hue??260;
  return(<div className="flex flex-col gap-6">
   <section className="rounded-[20px] bg-surface border border-line p-6 sm:p-7 flex flex-wrap items-center gap-5">
    <div aria-hidden className="size-20 rounded-full flex items-center justify-center text-3xl font-bold text-bg flex-none" style={{background:`hsl(${col} 65% 62%)`}}>{[...p.nick][0]?.toUpperCase()}</div>
    <div className="min-w-0 flex-1"><h1 className="text-2xl font-bold text-white break-words">{p.nick}</h1>
     <div className="mt-1.5 flex items-center gap-3 flex-wrap">
      <span role="img" aria-label={`${stars} من 5 نجوم`} className="text-xl tracking-wider text-amber">{"★".repeat(stars)}<span className="text-line">{"★".repeat(5-stars)}</span></span>
      <span className="text-xs rounded-full border border-line px-3 py-1 text-mute">{stars===0?"لاعب جديد":"Silver"}</span></div>
     {p.bio&&<p className="text-mute mt-2 leading-7">{p.bio}</p>}
     <p className="text-xs text-mute mt-2">انضم {new Date(p.created_at).toLocaleDateString("ar-DZ",{year:"numeric",month:"long"})}</p></div></section>
   <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[
     ["توقعات مُسوّاة",s.n],["نسبة الإصابة",rate===null?"—":rate+"%"],["النقاط",s.points],["أيام النشاط",s.days]].map(([t,v])=>
     <div key={String(t)} className="rounded-2xl bg-surface border border-line p-4"><div className="text-xs text-mute">{t}</div><b dir="ltr" className="block text-2xl text-white mt-1 text-start tabular-nums">{v}</b></div>)}</section>
   <p className="text-xs text-mute leading-6 -mt-2">النجوم تُحسب أوتوماتيكيا من النتائج المختومة فقط (تبدأ بعد 10 توقعات مُسوّاة). لا تُشترى ولا تُعطى بالتصويت.</p>
   <section className="rounded-[20px] bg-surface border border-line p-6 sm:p-7"><h2 className="text-lg font-semibold text-white mb-3">آخر التوقعات</h2>
    {calls?.length?<ul>{calls.map(c=><li key={c.match_id+c.kickoff} className="flex items-center justify-between gap-3 py-3 border-t border-line first:border-0">
      <div className="min-w-0"><div className="text-white">{lab(c)}</div><div className="text-xs text-mute mt-0.5">{nm.get(c.match_id)?`${nm.get(c.match_id)!.home} ضد ${nm.get(c.match_id)!.away} · `:""}{c.league} · {new Date(c.kickoff).toLocaleDateString("ar-DZ",{day:"numeric",month:"short",timeZone:"Africa/Algiers"})}</div></div>
      <span className={"text-xs rounded-full px-3 py-1 flex-none "+(!c.settled?"border border-line text-mute":c.hit?"bg-teal/20 text-teal":"bg-pink/15 text-pink")}>{!c.settled?"مفتوح":c.hit?"أصاب":"أخطأ"}</span></li>)}</ul>
    :<p className="text-mute">ما كاين توقعات بعد.</p>}</section></div>);
}
