import type {Versus} from "@/lib/versus";
// مقياس البشر ضد الآلة: قوس بحالة عداد الملعب، الإبرة تميل للي قدّام.
import {t,type Lang} from "@/lib/i18n";
export default function VersusBar({v,lang="ar"}:{v:Versus;lang?:Lang}){
  if(!v)return null;
  const tot=v.humans+v.ai||1,share=v.humans/tot; // 0..1، 1 = البشر
  const ang=(share-.5)*160; // درجات من الوسط
  const lead=t(lang,v.humans===v.ai?"vs.tie":v.humans>v.ai?"vs.humans":"vs.machine");
  return(<section className="panel p-5" aria-labelledby="vs-h">
    <div className="flex items-baseline justify-between gap-3"><h2 id="vs-h" className="text-[15px] font-semibold text-white">{t(lang,"vs.title")}</h2><span className="text-xs text-amber">{lead}</span></div>
    <div className="relative mx-auto mt-3 w-[220px] h-[116px]" role="img" aria-label={t(lang,"vs.aria",{h:v.humans,a:v.ai})}>
      <svg viewBox="0 0 220 116" className="absolute inset-0 w-full h-full" aria-hidden>
        <path d="M14 110 A96 96 0 0 1 206 110" fill="none" stroke="#1E2436" strokeWidth="14" strokeLinecap="round"/>
        <path d="M14 110 A96 96 0 0 1 110 14" fill="none" stroke="var(--color-pink)" strokeWidth="14" strokeLinecap="round" opacity=".9"/>
        <path d="M110 14 A96 96 0 0 1 206 110" fill="none" stroke="var(--color-violet)" strokeWidth="14" strokeLinecap="round" opacity=".9"/>
        <g style={{transform:`rotate(${-ang}deg)`,transformOrigin:"110px 110px"}} className="gauge-needle"><line x1="110" y1="110" x2="110" y2="30" stroke="#FFB020" strokeWidth="3" strokeLinecap="round"/></g>
        <circle cx="110" cy="110" r="7" fill="#FFB020"/>
      </svg>
    </div>
    <div className="grid grid-cols-2 gap-4 mt-1">
      <div><div className="font-display text-[34px] leading-none text-violet tabular-nums" dir="ltr">{v.ai}%</div><div className="text-xs text-mute mt-1.5">{t(lang,"vs.ai",{n:v.matches})}</div></div>
      <div className="text-end"><div className="font-display text-[34px] leading-none text-pink tabular-nums" dir="ltr">{v.humans}%</div><div className="text-xs text-mute mt-1.5">{t(lang,"vs.hum",{n:v.picks})}</div></div>
    </div>
    <p className="text-[11px] text-mute mt-4 leading-5">{t(lang,"vs.note")}</p>
  </section>);
}
