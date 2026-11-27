// أدوات صنّاع المحتوى: كيفاش تدير لايف مع هدف في TikTok ولا OBS.
export const dynamic="force-dynamic";
import {getDay} from "@/lib/day";
import CopyButton from "@/components/creator/CopyButton";
import StartPoll from "@/components/poll/StartPoll";
import {getLang} from "@/lib/lang";
import {t,locOf,leagueOf,type Lang} from "@/lib/i18n";
export async function generateMetadata(){return {title:t(await getLang(),"cr.title")}}
const PRI=["alg.1","caf.champions","caf.confed","ksa.1","eng.1","esp.1","uefa.champions","ita.1","ger.1","fra.1","uefa.europa","uefa.europa.conf","mar.1","egy.1","tun.1","fifa.world","uefa.nations","por.1","ned.1","tur.1","bra.1","arg.1","usa.1","mex.1","eng.2","nba","nhl","nfl","mlb"];
const rank=(s?:string)=>{const i=PRI.indexOf(s||"");return i<0?999:i};
const SITE="https://tikabro.thenytkng.workers.dev";
const time=(k:string,l:Lang)=>new Date(k).toLocaleTimeString(locOf(l),{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
export default async function Creator(){
  const lang=await getLang();const T=(k:Parameters<typeof t>[1])=>t(lang,k);
  const today=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
  const all=await getDay(today).catch(()=>[]);
  const ms=all.filter(m=>m.state!=="void"&&m.state!=="post").sort((a,b)=>(a.state==="live"?0:1)-(b.state==="live"?0:1)||rank(a.slug)-rank(b.slug)||a.kickoff.localeCompare(b.kickoff)).slice(0,10);
  const invite=t(lang,"cr.invite",{site:SITE});
  const card="rounded-2xl bg-card border border-line p-5";
  const steps=(["cr.s1","cr.s2","cr.s3","cr.s4","cr.s5","cr.s6","cr.s7"] as const).map(T);
  return(<div className="flex flex-col gap-5 max-w-3xl mx-auto">
   <section className={card}>
    <h1 className="font-display text-3xl text-white mb-2">{T("cr.title")}</h1>
    <p className="text-mute">{T("cr.pitch")}</p>
    <div className="flex flex-wrap gap-3 mt-4">
     <a href="/live/board" target="_blank" className="min-h-11 px-5 inline-flex items-center rounded-xl bg-amber text-[#0B0D14] font-bold">{T("cr.open_board")}</a>
     <CopyButton text={`${SITE}/live/board`} label={T("cr.copy_board")} lang={lang}/>
    </div>
    <p className="text-mute text-sm mt-3">{T("cr.group")} <bdi dir="ltr" className="text-white">/live/board?g=CODE</bdi></p>
   </section>
   <section className={card}>
    <h2 className="font-display text-2xl text-white mb-3">{T("cr.how")}</h2>
    <ol className="flex flex-col gap-3">{steps.map((s,i)=><li key={i} className="flex gap-3"><span className="shrink-0 w-8 h-8 rounded-full bg-violet/30 text-white grid place-items-center font-bold">{i+1}</span><span className="text-ink pt-1">{s}</span></li>)}</ol>
   </section>
   <section className={card}>
    <h2 className="font-display text-2xl text-white mb-3">{T("cr.today")}</h2>
    {ms.length?<ul className="flex flex-col divide-y divide-line">{ms.map(m=><li key={m.id} className="flex items-center gap-3 py-3">
     <div className="flex-1 min-w-0"><div className="text-white truncate"><bdi>{m.home}</bdi> - <bdi>{m.away}</bdi></div><div className="text-mute text-xs truncate"><bdi>{leagueOf(m,lang)}</bdi> · {m.state==="live"?<span className="text-pink">{T("live")}</span>:<bdi dir="ltr">{time(m.kickoff,lang)}</bdi>}</div></div>
     <a href={`/live/${encodeURIComponent(m.id)}`} target="_blank" className="shrink-0 min-h-11 px-4 inline-flex items-center rounded-xl border border-amber text-amber font-semibold">{T("cr.live_mode")}</a>
     <StartPoll matchId={m.id} liveHref={`/live/${encodeURIComponent(m.id)}`} lang={lang}/>
    </li>)}</ul>:<p className="text-mute">{T("cr.none")}</p>}
   </section>
   <section className={card}>
    <h2 className="font-display text-2xl text-white mb-3">{T("cr.invite_h")}</h2>
    <pre className="whitespace-pre-wrap font-sans text-ink bg-surface rounded-xl p-4 mb-3">{invite}</pre>
    <CopyButton text={invite} label={T("cr.copy_text")} lang={lang}/>
   </section>
  </div>);
}
