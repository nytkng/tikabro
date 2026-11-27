// حلقة احتمال الـ AI: فوز / تعادل / فوز، مرسومة بـ conic-gradient بلا مكتبات.
export default function ProbRing({h,d,a,size=96,label,pct}:{h:number;d:number;a:number;size?:number;label:string;pct:number}){
  const bg=`conic-gradient(var(--color-violet) 0 ${h}%,#3A4160 ${h}% ${h+d}%,var(--color-pink) ${h+d}% 100%)`;
  return(<div className="relative grid place-items-center rounded-full shrink-0" style={{width:size,height:size,background:bg}} role="img" aria-label={`توقع الـ AI: ${label} ${pct}%`}>
    <div className="absolute inset-[7px] rounded-full bg-[#0A0D17] grid place-items-center text-center">
      <span><b className="font-display text-[26px] leading-none text-white tabular-nums block" dir="ltr">{pct}%</b><span className="text-[10px] text-mute">ثقة الـ AI</span></span>
    </div></div>);
}
