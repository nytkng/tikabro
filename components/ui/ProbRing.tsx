// حلقة احتمال الـ AI: فوز / تعادل / فوز، مرسومة بـ conic-gradient بلا مكتبات.
import {t,type Lang} from "@/lib/i18n";
export default function ProbRing({h,d,a,size=96,label,pct,lang="ar"}:{h:number;d:number;a:number;size?:number;label:string;pct:number;lang?:Lang}){
  const bg=`conic-gradient(var(--color-violet) 0 ${h}%,#3A4160 ${h}% ${h+d}%,var(--color-pink) ${h+d}% 100%)`;
  return(<div className="relative grid place-items-center rounded-full shrink-0" style={{width:size,height:size,background:bg}} role="img" aria-label={t(lang,"ai_pred_aria",{l:label,p:pct})}>
    <div className="absolute inset-[7px] rounded-full bg-[#0A0D17] grid place-items-center text-center">
      <span><b className="font-display text-[26px] leading-none text-white tabular-nums block" dir="ltr">{pct}%</b><span className="text-[10px] text-mute">{t(lang,"ai_conf")}</span></span>
    </div></div>);
}
