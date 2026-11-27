import type {Ext} from "@/lib/model";
import {t,type Lang} from "@/lib/i18n";
// أسواق إضافية من نفس نموذج Dixon-Coles. نسب فقط، بلا أسعار مراهنة.
const Cell=({t,v,hot}:{t:string;v:number;hot:boolean})=>(
  <div className={"relative overflow-hidden rounded-xl border px-3.5 py-2.5 "+(hot?"border-teal/70":"border-line")}>
    <i aria-hidden className={"absolute inset-y-0 start-0 "+(hot?"bg-teal/25":"bg-white/[0.05]")} style={{width:v+"%"}}/>
    <div className="relative flex flex-col gap-1 min-w-0"><span className={"text-sm leading-5 break-words "+(hot?"text-white font-semibold":"text-[#C9CCE0]")}>{t}</span><b dir="ltr" className={"text-lg tabular-nums text-start "+(hot?"text-teal":"text-white")}>{v}%</b></div>
  </div>);
const Group=({title,hint,children}:{title:string;hint?:string;children:React.ReactNode})=>(
  <div><h3 className="text-white font-semibold mb-1">{title}</h3>{hint&&<p className="text-xs text-mute mb-2.5">{hint}</p>}<div className="grid grid-cols-2 gap-2.5 mt-2">{children}</div></div>);
export default function Markets({x,home,away,lang="ar"}:{x:Ext;home:string;away:string;lang?:Lang}){
  const hot=(a:number,b:number)=>[a>=b&&a>=58,b>a&&b>=58];
  const [byH,byN]=hot(x.btts.yes,x.btts.no);
  return(<section className="panel p-5 sm:p-6 flex flex-col gap-7">
    <div><h2 className="font-display text-xl text-white flex items-center gap-2"><i aria-hidden className="w-1.5 h-5 rounded-full bg-teal"/>{t(lang,"mk.title")}</h2>
     <p className="text-sm text-mute mt-1 leading-7">{t(lang,"mk.sub")} <b className="text-white">{t(lang,"mk.nobet")}</b></p></div>
    <div className="scoreboard rounded-xl p-4"><div className="text-sm text-mute mb-2">{t(lang,"mk.xg")}</div>
     <div className="flex items-center justify-between text-white"><bdi>{home}</bdi><b dir="ltr" className="text-2xl tabular-nums">{x.xg.h.toFixed(1)}</b></div>
     <div className="flex items-center justify-between text-white mt-1"><bdi>{away}</bdi><b dir="ltr" className="text-2xl tabular-nums">{x.xg.a.toFixed(1)}</b></div>
     <p className="text-xs text-mute mt-3 leading-6">{t(lang,"mk.xg_note")}</p></div>
    <Group title={t(lang,"mk.dc")}><Cell t={t(lang,"mk.or_draw",{t:home})} v={x.dc.x1} hot={x.dc.x1>=58&&x.dc.x1>=x.dc.x2}/><Cell t={t(lang,"mk.or_draw",{t:away})} v={x.dc.x2} hot={x.dc.x2>=58&&x.dc.x2>x.dc.x1}/><Cell t={t(lang,"mk.no_draw")} v={x.dc.x12} hot={x.dc.x12>=58}/></Group>
    <Group title={t(lang,"mk.btts")}><Cell t={t(lang,"yes")} v={x.btts.yes} hot={byH}/><Cell t={t(lang,"no")} v={x.btts.no} hot={byN}/></Group>
    {x.ou.map(o=>{const [a,b]=hot(o.over,o.under);return <Group key={o.line} title={t(lang,"mk.goals",{l:o.line})}><Cell t={t(lang,"mk.over",{l:o.line})} v={o.over} hot={a}/><Cell t={t(lang,"mk.under",{l:o.line})} v={o.under} hot={b}/></Group>})}
    <Group title={t(lang,"mk.team")}><Cell t={t(lang,"mk.scores",{t:home,n:1})} v={x.tg.h.o05} hot={x.tg.h.o05>=58}/><Cell t={t(lang,"mk.scores",{t:home,n:2})} v={x.tg.h.o15} hot={x.tg.h.o15>=58}/><Cell t={t(lang,"mk.scores",{t:away,n:1})} v={x.tg.a.o05} hot={x.tg.a.o05>=58}/><Cell t={t(lang,"mk.scores",{t:away,n:2})} v={x.tg.a.o15} hot={x.tg.a.o15>=58}/></Group>
    <div><h3 className="text-white font-semibold mb-2.5">{t(lang,"mk.likely")}</h3><div className="grid grid-cols-3 gap-2.5">{x.scores.map((s,i)=><div key={s.s} className={"rounded-xl border px-3 py-3 text-center "+(i===0?"border-violet/70 bg-violet/10":"border-line")}><b dir="ltr" className="block text-xl text-white tabular-nums">{s.s}</b><span dir="ltr" className="text-xs text-mute">{s.p}%</span></div>)}</div></div>
  </section>);
}
