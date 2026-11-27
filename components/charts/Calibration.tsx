/* eslint-disable @typescript-eslint/no-explicit-any */
// مخطط المعايرة: واش قال الـ AI (بنفسجي فاتح) مقابل واش صرا فعلا (بنفسجي معبّى). SVG خالص.
import {t,dirOf,type Lang} from "@/lib/i18n";
export type Bin={said:number;happened:number;n:number};
export default function Calibration({bins:raw,lang="ar"}:{bins:Bin[];lang?:Lang}){
  const f=(v:unknown)=>{let x=Number(v);if(!isFinite(x))x=0;if(x>1)x/=100;return Math.max(0,Math.min(1,x))};
  const bins:Bin[]=Array.from({length:10},(_,i)=>{const b=(raw||[]).find((r:any)=>Number(r?.bin)===i)??(raw||[])[i];return b?{said:f(b.said),happened:f(b.happened),n:Number(b.n)||0}:{said:0,happened:0,n:0}});
  const W=320,H=160,pad=18,bw=(W-pad)/10;
  return(<figure dir="ltr">
    <svg viewBox={`0 0 ${W} ${H+18}`} className="block w-full" style={{minHeight:160,height:"auto"}} preserveAspectRatio="xMidYMid meet" role="img" aria-label={t(lang,"ai.cal_aria")}>
      {[0,.5,1].map(t=><g key={t}><line x1={pad} x2={W} y1={H-t*H} y2={H-t*H} stroke="#1E2436"/><text x={0} y={H-t*H+3} fontSize="8" fill="#9AA1B5">{t*100}</text></g>)}
      {bins.map((b,i)=>{const x=pad+i*bw+2,w=(bw-6)/2,s=b.n?b.said:0,h=b.n?b.happened:0;return <g key={i}>
        <title>{`${i*10}–${i*10+10}%: `+t(lang,"ai.cal_tip",{s:Math.round(s*100),h:Math.round(h*100),n:b.n})}</title>
        <rect x={x} y={H-s*H} width={w} height={s*H} rx="2" fill="none" stroke="#8B7CFF" strokeWidth="1.2"/>
        <rect x={x+w+2} y={H-h*H} width={w} height={h*H} rx="2" fill="#8B7CFF" opacity={b.n<20?.45:1}/>
        <text x={x+w} y={H+12} fontSize="8" fill="#9AA1B5" textAnchor="middle">{i*10}</text></g>})}
    </svg>
    <figcaption className="flex gap-4 text-xs text-mute mt-2 justify-end" dir={dirOf(lang)}>
      <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm border border-violet inline-block"/>{t(lang,"ai.cal_said")}</span>
      <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-violet inline-block"/>{t(lang,"ai.cal_happened")}</span>
    </figcaption>
  </figure>);
}
