// خريطة حرارية: مربع لكل يوم، اللون = نسبة إصابة الـ AI. SVG خالص.
import {t,type Lang} from "@/lib/i18n";
export type Day={d:string;n:number;h:number};
export default function DayHeat({days,lang="ar"}:{days:Day[];lang?:Lang}){
  const map=new Map(days.map(x=>[x.d,x]));const N=91,today=new Date();
  const cells=Array.from({length:N},(_,i)=>{const dt=new Date(today.getTime()-(N-1-i)*864e5);const k=dt.toISOString().slice(0,10);return{k,dow:dt.getUTCDay(),x:map.get(k)}});
  const first=cells[0].dow,S=13,G=3;
  const col=(x?:Day)=>!x||!x.n?"rgba(255,255,255,.05)":x.h/x.n>=.6?"#2FBF71":x.h/x.n>=.45?"#7FB069":x.h/x.n>=.3?"#FFB020":"#E5484D";
  const W=Math.ceil((N+first)/7)*(S+G);
  return(<div className="overflow-x-auto"><svg viewBox={`0 0 ${W} ${7*(S+G)}`} className="min-w-[420px] w-full max-w-[640px]" role="img" aria-label={t(lang,"hm.aria")}>
    {cells.map((c,i)=>{const p=i+first;return <rect key={c.k} x={Math.floor(p/7)*(S+G)} y={(p%7)*(S+G)} width={S} height={S} rx={3} fill={col(c.x)}><title>{c.k}: {c.x?`${c.x.h}/${c.x.n}`:"—"}</title></rect>})}
  </svg>
  <div className="flex items-center gap-3 text-[11px] text-mute mt-2">{[["#E5484D","<30%"],["#FFB020","30–45%"],["#7FB069","45–60%"],["#2FBF71","60%+"]].map(([c,l])=><span key={l} className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:c}}/><bdi dir="ltr">{l}</bdi></span>)}</div></div>);
}
