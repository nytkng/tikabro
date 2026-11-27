import type {Versus} from "@/lib/versus";
// مقياس البشر ضد الآلة: قوس بحالة عداد الملعب، الإبرة تميل للي قدّام.
export default function VersusBar({v}:{v:Versus}){
  if(!v)return null;
  const tot=v.humans+v.ai||1,share=v.humans/tot; // 0..1، 1 = البشر
  const ang=(share-.5)*160; // درجات من الوسط
  const lead=v.humans===v.ai?"تعادل هذا الأسبوع":v.humans>v.ai?"البشر قدّام هذا الأسبوع":"الآلة قدّام هذا الأسبوع";
  return(<section className="panel p-5" aria-labelledby="vs-h">
    <div className="flex items-baseline justify-between gap-3"><h2 id="vs-h" className="text-[15px] font-semibold text-white">البشر ضد الآلة</h2><span className="text-xs text-amber">{lead}</span></div>
    <div className="relative mx-auto mt-3 w-[220px] h-[116px]" role="img" aria-label={`إصابة البشر ${v.humans}%، إصابة الـ AI ${v.ai}%`}>
      <svg viewBox="0 0 220 116" className="absolute inset-0 w-full h-full" aria-hidden>
        <path d="M14 110 A96 96 0 0 1 206 110" fill="none" stroke="#1E2436" strokeWidth="14" strokeLinecap="round"/>
        <path d="M14 110 A96 96 0 0 1 110 14" fill="none" stroke="var(--color-pink)" strokeWidth="14" strokeLinecap="round" opacity=".9"/>
        <path d="M110 14 A96 96 0 0 1 206 110" fill="none" stroke="var(--color-violet)" strokeWidth="14" strokeLinecap="round" opacity=".9"/>
        <g style={{transform:`rotate(${-ang}deg)`,transformOrigin:"110px 110px"}} className="gauge-needle"><line x1="110" y1="110" x2="110" y2="30" stroke="#FFB020" strokeWidth="3" strokeLinecap="round"/></g>
        <circle cx="110" cy="110" r="7" fill="#FFB020"/>
      </svg>
    </div>
    <div className="grid grid-cols-2 gap-4 mt-1">
      <div><div className="font-display text-[34px] leading-none text-violet tabular-nums" dir="ltr">{v.ai}%</div><div className="text-xs text-mute mt-1.5">الـ AI · {v.matches} مباراة</div></div>
      <div className="text-end"><div className="font-display text-[34px] leading-none text-pink tabular-nums" dir="ltr">{v.humans}%</div><div className="text-xs text-mute mt-1.5">البشر · {v.picks} توقع</div></div>
    </div>
    <p className="text-[11px] text-mute mt-4 leading-5">نسبة الإصابة في آخر 7 أيام، على نفس المباريات. كل توقع مختوم قبل الصافرة.</p>
  </section>);
}
