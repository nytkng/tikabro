// الجمهور ضد الـ AI: يتخبى الجمهور حتى تختم توقعك، باش يبقى توقعك مستقل (ماشي تقليد).
import {t,type Lang} from "@/lib/i18n";
type K="home"|"draw"|"away";
export default function CrowdVsAI({home,away,hasDraw,counts,ai,mine,revealed,outcome,lang="ar"}:{lang?:Lang;home:string;away:string;hasDraw:boolean;counts:Record<K,number>;ai:K|null;mine:K|null;revealed:boolean;outcome:K|null}){
  const n=counts.home+counts.draw+counts.away;
  const pc=(k:K)=>n?Math.round(counts[k]*100/n):0;
  const top:K|null=n?(["home","draw","away"] as K[]).reduce((a,b)=>counts[b]>counts[a]?b:a,"home"):null;
  const name=(k:K|null)=>k==="home"?t(lang,"win",{t:home}):k==="away"?t(lang,"win",{t:away}):k==="draw"?t(lang,"draw"):"—";
  const col=(ttl:string,k:K|null,acc:string,big?:boolean)=>{const ok=outcome&&k?k===outcome:null;return(
    <div className={"relative rounded-2xl p-3 pt-4 text-center flex flex-col items-center gap-2 min-w-0 border "+acc+(big?" -translate-y-1 shadow-[0_16px_30px_-18px_rgba(255,176,32,.6)]":"")}>
      <dt className="text-[11px] text-mute">{ttl}</dt>
      <dd className="text-white font-semibold text-[13px] leading-5 line-clamp-2 min-h-10"><bdi>{name(k)}</bdi></dd>
      {ok!==null&&<span className={"ai-chip "+(ok?"hit":"miss")}>{t(lang,ok?"hit":"miss")}</span>}
    </div>)};
  return(<section className="panel p-5 sm:p-6">
    <h2 className="font-display text-xl text-white mb-1 flex items-center gap-2"><i aria-hidden className="w-1.5 h-5 rounded-full bg-pink"/>{t(lang,"c.title")}</h2>
    {!revealed?<div className="relative mt-3 rounded-2xl border border-dashed border-line p-4 overflow-hidden">
      <div aria-hidden className="grid grid-cols-3 gap-2 blur-[6px] opacity-50 select-none">{["؟","؟","؟"].map((x,i)=><div key={i} className="h-16 rounded-xl bg-white/5 grid place-items-center font-display text-2xl">{x}</div>)}</div>
      <p className="relative text-sm text-[#C9CCE0] mt-3 leading-7 text-center">{n?<><b className="text-white tabular-nums">{n}</b> {t(lang,"c.sealed_n")}</>:""}{t(lang,"c.hidden")}</p></div>
    :n===0?<p className="text-sm text-mute">{t(lang,"c.none")}</p>
    :<>
      <p className="text-sm text-mute mb-4"><b className="text-white tabular-nums">{n}</b> {t(lang,"c.players")}{outcome?t(lang,"c.out"):""}.</p>
      <dl className="grid grid-cols-3 gap-2.5 items-end">
        {col(t(lang,"c.ai"),ai,"border-amber/50 bg-amber/[.06]",true)}
        {col(t(lang,"c.crowd"),top,"border-pink/40 bg-pink/[.05]")}
        {col(t(lang,"c.you"),mine,"border-violet/45 bg-violet/[.06]")}
      </dl>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-[3px] mt-5" aria-hidden><i style={{width:pc("home")+"%"}} className="bg-violet"/>{hasDraw&&pc("draw")>0&&<i style={{width:pc("draw")+"%"}} className="bg-[#4A5273]"/>}<i style={{width:pc("away")+"%"}} className="bg-pink"/></div>
      <div className="grid grid-cols-3 text-xs mt-2 text-[#C9CCE0]"><span className="truncate"><bdi>{home}</bdi> <b dir="ltr" className="text-white">{pc("home")}%</b></span><span className="text-center">{hasDraw&&<>{t(lang,"draw")} <b dir="ltr" className="text-white">{pc("draw")}%</b></>}</span><span className="truncate text-end"><bdi>{away}</bdi> <b dir="ltr" className="text-white">{pc("away")}%</b></span></div>
      {!outcome&&ai&&top&&<p className="text-sm text-[#C9CCE0] mt-4 rounded-xl bg-white/[.03] px-3 py-2.5">{t(lang,ai===top?"c.agree":"c.disagree")}</p>}
    </>}
  </section>);
}
