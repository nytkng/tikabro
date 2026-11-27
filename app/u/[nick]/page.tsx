export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import {starsOf} from "@/lib/stars";
import Seal from "@/components/ui/Seal";
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
  const tiles:[string,string|number,string][]=[["توقعات مسوّاة",s.n,"text-white"],["نسبة الإصابة",rate===null?"—":rate+"%","text-teal"],["النقاط",s.points,"text-amber"],["أيام النشاط",s.days,"text-white"]];
  const hits=(calls||[]).filter(c=>c.settled&&c.hit).length,miss=(calls||[]).filter(c=>c.settled&&!c.hit).length;
  return(<div className="flex flex-col gap-5">
   <section className="stage relative overflow-hidden rounded-[22px] p-5 sm:p-7">
    <div className="relative flex items-center gap-4">
     <div aria-hidden className="relative shrink-0 rounded-full p-[3px]" style={{background:`conic-gradient(hsl(${col} 70% 62%),hsl(${(col+60)%360} 70% 60%),hsl(${col} 70% 62%))`}}>
      <div className="size-[84px] rounded-full bg-[#0A0D17] p-1"><div className="size-full rounded-full grid place-items-center font-display text-4xl text-[#0B0D14]" style={{background:`radial-gradient(circle at 35% 30%,hsl(${col} 80% 75%),hsl(${col} 60% 55%))`}}>{[...p.nick][0]?.toUpperCase()}</div></div></div>
     <div className="min-w-0 flex-1"><p className="text-xs text-mute">متوقّع في هدف</p><h1 className="font-display text-[28px] sm:text-4xl leading-tight text-white break-words"><bdi>{p.nick}</bdi></h1>
      <p className="text-xs text-mute mt-1">انضم {new Date(p.created_at).toLocaleDateString("ar-DZ",{year:"numeric",month:"long"})}</p></div>
    </div>
    <div className="relative mt-5 flex items-center gap-2 flex-wrap" role="img" aria-label={`${stars} من 5 نجوم`}>
     {[0,1,2,3,4].map(i=><Seal key={i} size={36} className={i<stars?"seal":"!text-[#3A4160] !shadow-[inset_0_0_0_2px_#2A3048] !bg-none"}>★</Seal>)}
     <span className="text-xs rounded-full bg-white/5 px-3 py-1.5 text-[#C9CCE0] ms-1">{stars===0?"لاعب جديد":`${stars} نجوم`}</span></div>
    {p.bio&&<p className="relative text-[#C9CCE0] mt-4 leading-7 text-sm">{p.bio}</p>}
   </section>
   <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">{tiles.map(([t,v,c])=>
     <div key={t} className="panel p-4"><div className="text-xs text-mute">{t}</div><b dir="ltr" className={"block font-display text-3xl mt-1 text-start tabular-nums "+c}>{v}</b></div>)}</section>
   <p className="text-xs text-mute leading-6 -mt-1">النجوم تتحسب وحدها من النتائج المختومة برك (تبدا بعد 10 توقعات مسوّاة). ما تتشراش وما تتعطاش بالتصويت.</p>
   <section className="panel p-5 sm:p-6"><div className="flex items-center justify-between gap-3 mb-4"><h2 className="font-display text-xl text-white flex items-center gap-2"><i aria-hidden className="w-1.5 h-5 rounded-full bg-amber"/>آخر التوقعات</h2>
     {(hits+miss)>0&&<span className="text-xs text-mute"><b className="text-teal tabular-nums">{hits}</b> صاب · <b className="text-pink tabular-nums">{miss}</b> غلط</span>}</div>
    {calls?.length?<ol className="relative ps-5 before:content-[''] before:absolute before:top-2 before:bottom-2 before:start-[5px] before:w-px before:bg-line">{calls.map(c=>{const mm=nm.get(c.match_id);const dot=!c.settled?"bg-[#3A4160]":c.hit?"bg-teal shadow-[0_0_0_4px_rgba(94,200,184,.15)]":"bg-pink shadow-[0_0_0_4px_rgba(232,121,166,.12)]";
     return <li key={c.match_id+c.kickoff} className="relative flex items-center justify-between gap-3 py-2.5">
      <i aria-hidden className={"absolute -start-5 top-1/2 -translate-y-1/2 size-[11px] rounded-full "+dot}/>
      <div className="min-w-0"><div className="text-white text-[14px] truncate"><bdi>{lab(c)}</bdi></div><div className="text-xs text-mute mt-0.5 truncate">{mm?<><bdi>{mm.home}</bdi> ضد <bdi>{mm.away}</bdi> · </>:""}<bdi>{c.league}</bdi> · {new Date(c.kickoff).toLocaleDateString("ar-DZ",{day:"numeric",month:"short",timeZone:"Africa/Algiers"})}</div></div>
      <span className={"ai-chip shrink-0 "+(!c.settled?"":c.hit?"hit":"miss !no-underline !text-pink !border-pink/40")}>{!c.settled?"مفتوح":c.hit?`صاب${c.points?` +${c.points}`:""}`:"غلط"}</span></li>})}</ol>
    :<p className="text-mute text-sm">مازال ما كاين حتى توقع.</p>}</section></div>);
}
