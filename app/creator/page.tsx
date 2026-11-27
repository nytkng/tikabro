// أدوات صنّاع المحتوى: كيفاش تدير لايف مع هدف في TikTok ولا OBS.
export const dynamic="force-dynamic";
import {getDay} from "@/lib/day";
import CopyButton from "@/components/creator/CopyButton";
import StartPoll from "@/components/poll/StartPoll";
export const metadata={title:"أدوات صنّاع المحتوى"};
const PRI=["alg.1","caf.champions","caf.confed","ksa.1","eng.1","esp.1","uefa.champions","ita.1","ger.1","fra.1","uefa.europa","uefa.europa.conf","mar.1","egy.1","tun.1","fifa.world","uefa.nations","por.1","ned.1","tur.1","bra.1","arg.1","usa.1","mex.1","eng.2","nba","nhl","nfl","mlb"];
const rank=(s?:string)=>{const i=PRI.indexOf(s||"");return i<0?999:i};
const SITE="https://tikabro.thenytkng.workers.dev";
const time=(k:string)=>new Date(k).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"});
export default async function Creator(){
  const today=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
  const all=await getDay(today).catch(()=>[]);
  const ms=all.filter(m=>m.state!=="void"&&m.state!=="post").sort((a,b)=>(a.state==="live"?0:1)-(b.state==="live"?0:1)||rank(a.slug)-rank(b.slug)||a.kickoff.localeCompare(b.kickoff)).slice(0,10);
  const invite=`راني في لايف نتوقعو الماتشات ضد الذكاء الاصطناعي ⚽🤖\nدخل لـ هدف، دير توقعك وشوف اسمك يطلع في التوب 10 قدام الناس كامل!\n${SITE}`;
  const card="rounded-2xl bg-card border border-line p-5";
  const steps=["افتح لوحة اللايف (الزر لتحت) وانسخ الرابط تاعها.","في OBS: زيد Source من نوع «Browser»، حط الرابط، والمقاس 1080×1920 للتيكتوك (عمودي) ولا 1920×1080 للأفقي.","في TikTok LIVE Studio: زيد «Link» ولا «Browser source» وحط نفس الرابط.","اللوحة تتحدّث وحدها كل 30 ثانية، ما تحتاج تعاود تفتحها.","لماتش واحد: اختار الماتش من القائمة واضغط «وضع اللايف»، يبان توقع الجمهور ضد الـ AI.","التصويت السريع (لازم تكون مسجّل): اضغط «ابدا تصويت» على ماتش، قول الكود في اللايف، والناس يصوتو بلا تسجيل.","انسخ نص الدعوة وحطو في التعليقات ولا في البايو باش الناس يدخلو يتوقعو."];
  return(<div className="flex flex-col gap-5 max-w-3xl mx-auto">
   <section className={card}>
    <h1 className="font-display text-3xl text-white mb-2">أدوات صنّاع المحتوى</h1>
    <p className="text-mute">ديرو لايف مع جمهوركم: الناس يتوقعو، والتوب 10 يبان مباشرة في البث.</p>
    <div className="flex flex-wrap gap-3 mt-4">
     <a href="/live/board" target="_blank" className="min-h-11 px-5 inline-flex items-center rounded-xl bg-amber text-[#0B0D14] font-bold">افتح لوحة اللايف</a>
     <CopyButton text={`${SITE}/live/board`} label="انسخ رابط اللوحة"/>
    </div>
    <p className="text-mute text-sm mt-3">عندك دوري أصحاب؟ زيد الكود: <bdi dir="ltr" className="text-white">/live/board?g=CODE</bdi></p>
   </section>
   <section className={card}>
    <h2 className="font-display text-2xl text-white mb-3">كيفاش تخدم</h2>
    <ol className="flex flex-col gap-3">{steps.map((s,i)=><li key={i} className="flex gap-3"><span className="shrink-0 w-8 h-8 rounded-full bg-violet/30 text-white grid place-items-center font-bold">{i+1}</span><span className="text-ink pt-1">{s}</span></li>)}</ol>
   </section>
   <section className={card}>
    <h2 className="font-display text-2xl text-white mb-3">ماتشات اليوم</h2>
    {ms.length?<ul className="flex flex-col divide-y divide-line">{ms.map(m=><li key={m.id} className="flex items-center gap-3 py-3">
     <div className="flex-1 min-w-0"><div className="text-white truncate"><bdi>{m.home}</bdi> - <bdi>{m.away}</bdi></div><div className="text-mute text-xs truncate"><bdi>{m.league}</bdi> · {m.state==="live"?<span className="text-pink">مباشر</span>:<bdi dir="ltr">{time(m.kickoff)}</bdi>}</div></div>
     <a href={`/live/${encodeURIComponent(m.id)}`} target="_blank" className="shrink-0 min-h-11 px-4 inline-flex items-center rounded-xl border border-amber text-amber font-semibold">وضع اللايف</a>
     <StartPoll matchId={m.id} liveHref={`/live/${encodeURIComponent(m.id)}`}/>
    </li>)}</ul>:<p className="text-mute">ما كاين حتى ماتش اليوم.</p>}
   </section>
   <section className={card}>
    <h2 className="font-display text-2xl text-white mb-3">نص الدعوة للمتابعين</h2>
    <pre className="whitespace-pre-wrap font-sans text-ink bg-surface rounded-xl p-4 mb-3">{invite}</pre>
    <CopyButton text={invite} label="انسخ النص"/>
   </section>
  </div>);
}
