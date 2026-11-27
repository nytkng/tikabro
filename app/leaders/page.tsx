export const dynamic = "force-dynamic";
import {db} from "@/lib/db";
export const metadata={title:"الترتيب"};
type Row={nick:string;n:number;hits:number;points:number};
type Ai={n:number;hits:number;points:number};
export default async function Leaders({searchParams}:{searchParams:Promise<{r?:string}>}){
  const {r}=await searchParams;const all=r==="all";
  const since=all?"2020-01-01T00:00:00Z":new Date(Date.now()-7*864e5).toISOString();
  const post=(b:object)=>({method:"POST",body:JSON.stringify(b)});
  const [rows,ai]=await Promise.all([
    db<Row[]>("rpc/leaderboard",post({p_since:since,p_min:1,p_days:1,p_age:"0 seconds"})),
    db<Ai[]>("rpc/ai_points",post({p_since:since})),
  ]);
  const a=ai?.[0];
  const list:(Row&{ai?:boolean})[]=[...(rows||[])];
  if(a&&a.n>0)list.push({nick:"الـ AI (هدف)",n:a.n,hits:a.hits,points:a.points,ai:true});
  list.sort((x,y)=>y.points-x.points);
  const top3=list.slice(0,3),rest=list.slice(3);
  const med=["#FFC857","#C9CCE0","#D08B5B"];
  const nameEl=(x:typeof list[0])=>x.ai?<bdi>{x.nick}</bdi>:<a href={`/u/${encodeURIComponent(x.nick)}`} className="hover:text-violet"><bdi>{x.nick}</bdi></a>;
  const tabs=<div className="seg mb-1">{[["/leaders","هذا الأسبوع",!all],["/leaders?r=all","كل الوقت",all]].map(([h,l,on])=><a key={String(h)} href={String(h)} aria-current={on?"page":undefined} className={"flex-1 h-11 rounded-[10px] grid place-items-center text-sm "+(on?"bg-[var(--surface-2)] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,176,32,.45)]":"text-[#C9CCE0] hover:bg-hover")}>{l}</a>)}</div>;
  // ترتيب البوديوم: الثاني، الأول، الثالث
  const pod=[top3[1],top3[0],top3[2]].map((x,k)=>x?{x,r:[2,1,3][k]}:null);
  return(<div className="flex flex-col gap-5">
   <header className="stage relative overflow-hidden rounded-[22px] p-5 sm:p-7"><div className="relative">
    <h1 className="font-display text-[32px] text-white leading-tight">الترتيب</h1><p className="text-sm text-[#C9CCE0] mt-1">شكون يقرا الماتشات خير؟ النقاط غير من التوقعات المختومة قبل الصافرة.</p>
    {list.length>0&&<div className="grid grid-cols-3 items-end gap-2 mt-6">{pod.map((o,k)=>o?<div key={k} className="flex flex-col items-center gap-2 min-w-0 text-center">
      <span className="medal !w-11 !h-11 !text-base" style={{["--m" as string]:med[o.r-1]}}>{o.r}</span>
      <span className={"text-[13px] font-semibold truncate max-w-full "+(o.x.ai?"text-amber":"text-white")}>{nameEl(o.x)}</span>
      <div className={"w-full rounded-t-xl border border-b-0 grid place-items-center pt-2 "+(o.x.ai?"border-amber/50 bg-amber/10":"border-[var(--edge)] bg-white/[.04]")} style={{height:o.r===1?96:o.r===2?72:56}}>
       <span><b className="font-display text-2xl text-white tabular-nums block leading-none">{o.x.points}</b><span className="text-[10px] text-mute">نقطة</span></span></div></div>:<div key={k}/>)}</div>}
   </div></header>
   {tabs}
   {rows===null?<p className="panel p-5 text-mute leading-7">ما قدرناش نتصلو بقاعدة البيانات دركا.</p>
   :list.length?(rest.length>0&&<ol className="panel p-2" start={4}>{rest.map((x,i)=><li key={x.nick} className={"flex items-center gap-3 min-h-[56px] px-3 rounded-xl "+(x.ai?"bg-amber/10 shadow-[inset_-3px_0_0_#FFB020]":"")+(i?" border-t border-[var(--edge)]":"")}>
     <b className="w-7 text-center tabular-nums text-mute">{i+4}</b>
     <span className={"flex-1 min-w-0 truncate font-semibold "+(x.ai?"text-amber":"text-white")}>{nameEl(x)}</span>
     <span className="text-xs text-mute tabular-nums shrink-0">{x.hits} من {x.n}</span>
     <b className="tabular-nums text-white shrink-0 min-w-[48px] text-end">{x.points}<span className="text-[10px] text-mute font-normal ms-1">ن</span></b></li>)}</ol>)
   :<p className="panel p-5 text-mute leading-7">ما كاين حتى توقع مسوّى في هذي الفترة. كي تكمل المباريات المختومة، يبانو المتوقعين هنا مع الـ AI.</p>}
  </div>);
}
