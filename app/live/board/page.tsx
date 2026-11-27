// لوحة اللايف: أحسن 10 متوقعين هاد الأسبوع، للبث في TikTok/OBS. تتحدّث كل 30 ثانية.
export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import {weekVersus} from "@/lib/versus";
import LiveRefresh from "@/components/LiveRefresh";
import {getLang} from "@/lib/lang";
import {t} from "@/lib/i18n";
export async function generateMetadata(){return {title:t(await getLang(),"lv.board")}}
type Row={nick:string;n:number;hits:number;points:number};
const isAI=(s:string)=>/ai|hadaf/i.test(s);
const SITE="tikabro.thenytkng.workers.dev";
export default async function Board({searchParams}:{searchParams:Promise<{g?:string}>}){
  const {g:raw}=await searchParams;const lang=await getLang();
  const code=String(raw||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  const since=new Date(Date.now()-7*864e5).toISOString();
  const grp=/^[A-Z0-9]{8}$/.test(code)?(await db<{id:string;name:string}[]>(`groups?code=eq.${code}&select=id,name&limit=1`).catch(()=>null))?.[0]:undefined;
  const [rows,vs]=await Promise.all([
    grp?db<Row[]>("rpc/group_board",{method:"POST",body:JSON.stringify({p_group:grp.id,p_since:since})}).catch(()=>null)
       :db<Row[]>("rpc/leaderboard",{method:"POST",body:JSON.stringify({p_since:since,p_min:1,p_days:1,p_age:"0 seconds"})}).catch(()=>null),
    weekVersus().catch(()=>null)]);
  const list=(rows||[]).slice(0,10);const pod=list.slice(0,3);const rest=list.slice(3);
  const acc=(r:Row)=>r.n?Math.round(100*r.hits/r.n):0;
  // ترتيب المنصّة: الثاني، الأول، الثالث
  const order=[pod[1],pod[0],pod[2]];const medal=["🥈","🥇","🥉"];const hgt=["h-28 portrait:h-40","h-36 portrait:h-56","h-24 portrait:h-32"];
  return(<div className="fixed inset-0 z-50 bg-[#0B0D14] overflow-hidden flex flex-col p-6 portrait:p-10 gap-5 portrait:gap-8">
   <LiveRefresh on every={30}/>
   <header className="flex items-center justify-between gap-4">
    <div className="flex items-baseline gap-1"><span className="font-display text-5xl portrait:text-6xl text-white">{t(lang,"lv.brand")}</span><i className="w-3 h-3 rounded-full bg-amber inline-block"/></div>
    <div className="text-end"><div className="font-display text-3xl portrait:text-4xl text-white">{grp?<bdi>{t(lang,"lv.league",{name:grp.name})}</bdi>:t(lang,"lv.top10")}</div><div className="text-mute text-sm portrait:text-lg">{t(lang,"lv.sub")}</div></div>
   </header>
   {!list.length?<div className="flex-1 grid place-items-center text-center"><div><div className="font-display text-5xl text-amber mb-3">{t(lang,"lv.empty")}</div><div className="text-[#C9CCE0] text-2xl">{t(lang,"lv.be_first")}</div></div></div>:
   <div className="flex-1 min-h-0 flex landscape:flex-row portrait:flex-col gap-6 portrait:gap-8">
    <div className="flex items-end justify-center gap-3 portrait:gap-5 landscape:w-[45%]">
     {order.map((r,i)=>r?<div key={r.nick} className="flex-1 max-w-56 flex flex-col items-center gap-2">
      <div className="text-5xl portrait:text-6xl">{isAI(r.nick)?"🤖":medal[i]}</div>
      <b className={"text-xl portrait:text-3xl truncate max-w-full "+(isAI(r.nick)?"text-amber":"text-white")}><bdi>{r.nick}</bdi></b>
      <div className="font-display text-3xl portrait:text-5xl text-white tabular-nums">{r.points}</div>
      <div className={"w-full rounded-t-2xl border border-b-0 grid place-items-start justify-center pt-3 "+hgt[i]+" "+(isAI(r.nick)?"bg-amber/20 border-amber":i===1?"bg-violet/30 border-violet":"bg-card border-line")}><span className="text-mute tabular-nums text-sm portrait:text-xl">{r.hits}/{r.n} · {acc(r)}%</span></div>
     </div>:<div key={i} className="flex-1 max-w-56"/>)}
    </div>
    <ol className="flex-1 min-h-0 flex flex-col gap-2 portrait:gap-3 justify-center">
     {rest.map((r,i)=><li key={r.nick} className={"flex items-center gap-4 rounded-2xl border px-5 py-2.5 portrait:py-4 "+(isAI(r.nick)?"bg-amber/15 border-amber":"bg-card border-line")}>
      <span className="font-display text-2xl portrait:text-3xl text-mute w-8 tabular-nums">{i+4}</span>
      <b className={"flex-1 truncate text-xl portrait:text-2xl "+(isAI(r.nick)?"text-amber":"text-white")}>{isAI(r.nick)&&"🤖 "}<bdi>{r.nick}</bdi></b>
      <span className="text-mute tabular-nums portrait:text-xl">{r.hits}/{r.n}</span>
      <span className="font-display text-2xl portrait:text-3xl text-white tabular-nums w-20 text-end">{r.points}</span>
     </li>)}
    </ol>
   </div>}
   {vs&&<div className="rounded-3xl bg-card border border-line p-4 portrait:p-6">
    <div className="flex justify-between text-lg portrait:text-2xl mb-2"><span className="text-violet">{t(lang,"lv.humans")} <b className="font-display tabular-nums">{vs.humans}%</b></span><span className="text-mute text-sm portrait:text-lg self-center">{t(lang,"lv.rate7")}</span><span className="text-amber"><b className="font-display tabular-nums">{vs.ai}%</b> {t(lang,"ai.ai")}</span></div>
    <div className="h-4 portrait:h-5 rounded-full overflow-hidden flex bg-line"><i className="bg-violet" style={{width:`${100*vs.humans/((vs.humans+vs.ai)||1)}%`}}/><i className="bg-amber flex-1"/></div>
   </div>}
   <footer className="text-center text-[#C9CCE0] text-xl portrait:text-3xl">{t(lang,"lv.cta")} <b className="text-white" dir="ltr">{SITE}</b></footer>
  </div>);
}
