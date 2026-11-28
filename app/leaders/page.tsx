export const dynamic = "force-dynamic";
import {db} from "@/lib/db";
import {getLang} from "@/lib/lang";
import {t} from "@/lib/i18n";
export async function generateMetadata(){return {title:t(await getLang(),"ld.title")}}
type Row={nick:string;n:number;hits:number;points:number};
type Ai={n:number;hits:number;points:number};
export default async function Leaders({searchParams}:{searchParams:Promise<{r?:string}>}){
  const {r}=await searchParams;const all=r==="all";const lang=await getLang();
  const since=all?"2020-01-01T00:00:00Z":new Date(Date.now()-7*864e5).toISOString();
  const post=(b:object)=>({method:"POST",body:JSON.stringify(b)});
  const [rows,ai]=await Promise.all([
    db<Row[]>("rpc/leaderboard",post({p_since:since,p_min:1,p_days:1,p_age:"0 seconds"})),
    db<Ai[]>("rpc/ai_points",post({p_since:since})),
  ]);
  const peer=await db<{nick:string;n:number;hits:number;peer:number;vs_ai:number|null}[]>("rpc/peer_board",post({p_since:all?"2020-01-01T00:00:00Z":new Date(Date.now()-30*864e5).toISOString(),p_min:all?10:5,p_limit:20}));
  const cb=await db<{nick:string;n:number;brier:number;avg_conf:number;hit_rate:number}[]>("rpc/conf_board",post({p_since:all?"2020-01-01T00:00:00Z":new Date(Date.now()-30*864e5).toISOString(),p_min:5,p_limit:20})).catch(()=>null);
  const a=ai?.[0];
  const list:(Row&{ai?:boolean})[]=[...(rows||[])];
  if(a&&a.n>0)list.push({nick:t(lang,"ld.ai"),n:a.n,hits:a.hits,points:a.points,ai:true});
  list.sort((x,y)=>y.points-x.points);
  const top3=list.slice(0,3),rest=list.slice(3);
  const med=["#FFC857","#C9CCE0","#D08B5B"];
  const nameEl=(x:typeof list[0])=>x.ai?<bdi>{x.nick}</bdi>:<a href={`/u/${encodeURIComponent(x.nick)}`} className="hover:text-violet"><bdi>{x.nick}</bdi></a>;
  const tabs=<div className="seg mb-1">{[["/leaders",t(lang,"ld.week"),!all],["/leaders?r=all",t(lang,"ld.all"),all]].map(([h,l,on])=><a key={String(h)} href={String(h)} aria-current={on?"page":undefined} className={"flex-1 h-11 rounded-[10px] grid place-items-center text-sm "+(on?"bg-[var(--surface-2)] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,176,32,.45)]":"text-[#C9CCE0] hover:bg-hover")}>{l}</a>)}</div>;
  // ترتيب البوديوم: الثاني، الأول، الثالث
  const pod=[top3[1],top3[0],top3[2]].map((x,k)=>x?{x,r:[2,1,3][k]}:null);
  return(<div className="flex flex-col gap-5">
   <header className="stage relative overflow-hidden rounded-[22px] p-5 sm:p-7"><div className="relative">
    <h1 className="font-display text-[32px] text-white leading-tight">{t(lang,"ld.title")}</h1><p className="text-sm text-[#C9CCE0] mt-1">{t(lang,"ld.sub")}</p>
    {list.length>0&&<div className="grid grid-cols-3 items-end gap-2 mt-6">{pod.map((o,k)=>o?<div key={k} className="flex flex-col items-center gap-2 min-w-0 text-center">
      <span className="medal !w-11 !h-11 !text-base" style={{["--m" as string]:med[o.r-1]}}>{o.r}</span>
      <span className={"text-[13px] font-semibold truncate max-w-full "+(o.x.ai?"text-amber":"text-white")}>{nameEl(o.x)}</span>
      <div className={"w-full rounded-t-xl border border-b-0 grid place-items-center pt-2 "+(o.x.ai?"border-amber/50 bg-amber/10":"border-[var(--edge)] bg-white/[.04]")} style={{height:o.r===1?96:o.r===2?72:56}}>
       <span><b className="font-display text-2xl text-white tabular-nums block leading-none">{o.x.points}</b><span className="text-[10px] text-mute">{t(lang,"ld.pts")}</span></span></div></div>:<div key={k}/>)}</div>}
   </div></header>
   {tabs}
   {rows===null?<p className="panel p-5 text-mute leading-7">{t(lang,"ld.db")}</p>
   :list.length?(rest.length>0&&<ol className="panel p-2" start={4}>{rest.map((x,i)=><li key={x.nick} className={"flex items-center gap-3 min-h-[56px] px-3 rounded-xl "+(x.ai?"bg-amber/10 "+(lang==="ar"?"shadow-[inset_-3px_0_0_#FFB020]":"shadow-[inset_3px_0_0_#FFB020]")+"":"")+(i?" border-t border-[var(--edge)]":"")}>
     <b className="w-7 text-center tabular-nums text-mute">{i+4}</b>
     <span className={"flex-1 min-w-0 truncate font-semibold "+(x.ai?"text-amber":"text-white")}>{nameEl(x)}</span>
     <span className="text-xs text-mute tabular-nums shrink-0">{t(lang,"ld.of",{h:x.hits,n:x.n})}</span>
     <b className="tabular-nums text-white shrink-0 min-w-[48px] text-end">{x.points}<span className="text-[10px] text-mute font-normal ms-1">{t(lang,"ld.p")}</span></b></li>)}</ol>)
   :<p className="panel p-5 text-mute leading-7">{t(lang,"ld.empty")}</p>}
   {peer&&peer.length>0&&<section className="panel p-5"><h2 className="text-lg font-semibold text-white mb-1">{t(lang,"pr.title")}</h2><p className="text-sm text-mute mb-4 leading-7">{t(lang,"pr.note")}</p>
    <ol className="flex flex-col gap-1">{peer.map((x,i)=><li key={x.nick} className="flex items-center gap-3 min-h-[48px] px-2 rounded-lg hover:bg-hover">
     <b className="w-6 text-center tabular-nums text-mute">{i+1}</b>
     <a href={`/u/${encodeURIComponent(x.nick)}`} className="flex-1 min-w-0 truncate font-semibold text-white hover:text-violet"><bdi>{x.nick}</bdi></a>
     {x.vs_ai!=null&&<span title={t(lang,"pr.vs_ai")} className={"text-xs tabular-nums shrink-0 "+(x.vs_ai>0?"text-win":"text-mute")} dir="ltr">AI {x.vs_ai>0?"+":""}{x.vs_ai}</span>}
     <span className="text-xs text-mute tabular-nums shrink-0">{t(lang,"ld.of",{h:x.hits,n:x.n})}</span>
     <b className={"tabular-nums shrink-0 min-w-[56px] text-end "+(x.peer>0?"text-win":x.peer<0?"text-loss":"text-white")} dir="ltr">{x.peer>0?"+":""}{x.peer}</b></li>)}</ol></section>}
   {cb&&cb.length>0&&<section className="panel p-5"><h2 className="text-lg font-semibold text-white mb-1">{t(lang,"cb.title")}</h2><p className="text-sm text-mute mb-4 leading-7">{t(lang,"cb.note")}</p>
    <ol className="flex flex-col gap-1">{cb.map((x,i)=><li key={x.nick} className="flex items-center gap-3 min-h-[48px] px-2 rounded-lg hover:bg-hover">
     <b className="w-6 text-center tabular-nums text-mute">{i+1}</b>
     <a href={`/u/${encodeURIComponent(x.nick)}`} className="flex-1 min-w-0 truncate font-semibold text-white hover:text-violet"><bdi>{x.nick}</bdi></a>
     <span className="text-xs text-mute tabular-nums shrink-0" dir="ltr">{x.avg_conf}% → {x.hit_rate}%</span>
     <b className="tabular-nums text-white shrink-0 min-w-[56px] text-end" dir="ltr">{x.brier.toFixed(3)}</b></li>)}</ol></section>}
  </div>);
}
