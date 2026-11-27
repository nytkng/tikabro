// رسومات SVG مكتوبة باليد (بلا مكتبات، بلا JS في المتصفح). كلها مكونات سيرفر.
import {t,type Lang} from "@/lib/i18n";
const V="#8B7CFF",P="#E879A6",A="#FFB020",M="#9AA1B5",R="#F87171";
const r1=(x:number)=>Math.round(x*10)/10;

/** منحنى ناعم يمر على النقاط (Catmull-Rom → Bezier) */
export function smooth(pts:[number,number][]):string{
  if(!pts.length)return "";if(pts.length===1)return `M${pts[0][0]},${pts[0][1]}`;
  let d=`M${r1(pts[0][0])},${r1(pts[0][1])}`;
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
    const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
    d+=` C${r1(c1[0])},${r1(c1[1])} ${r1(c2[0])},${r1(c2[1])} ${r1(p2[0])},${r1(p2[1])}`}
  return d;
}

/* ===== صناديق الفورمة ف/ت/خ ===== */
const FC:Record<string,string>={W:"bg-win text-bg",D:"bg-draw text-bg",L:"bg-loss text-white"};
export function FormBoxes({f,lang,size="sm"}:{f?:string|null;lang:Lang;size?:"sm"|"md"}){
  const s=(f||"").toUpperCase().replace(/[^WDL]/g,"").slice(0,5);if(!s)return null;
  const txt=[...s].map(c=>t(lang,("viz."+c) as "viz.W")).join(" ");
  const box=size==="md"?"w-[22px] h-[22px] sm:w-7 sm:h-7 text-[11px] sm:text-sm rounded-md":"w-[15px] h-[15px] text-[9px] rounded-[4px]";
  return <span role="img" aria-label={t(lang,"viz.form_of",{f:txt})} className="inline-flex gap-[3px] shrink-0" dir="ltr">
    {[...s].map((c,i)=><i key={i} aria-hidden className={"not-italic font-bold leading-none grid place-items-center "+box+" "+FC[c]}>{t(lang,("viz."+c) as "viz.W")}</i>)}</span>;
}

/* ===== بلاطات الاحتمال (Polymarket) ===== */
export function ProbTiles({p,pick,labels,lang}:{p:{h:number;d:number;a:number};pick:"h"|"d"|"a"|null;labels:{h:string;d:string;a:string};lang:Lang}){
  const ks=(["h","d","a"] as const).filter(k=>k!=="d"||p.d>0);
  return <div className={"grid gap-2 mt-5 "+(ks.length===3?"grid-cols-3":"grid-cols-2")}>{ks.map(k=>{const on=k===pick;
    return <div key={k} className={"rounded-xl border px-2 py-3 text-center min-w-0 "+(on?"border-amber/70 bg-amber/10 shadow-[0_0_24px_-10px_var(--color-amber)]":"border-line bg-white/[.02]")}>
      <div className={"text-[11px] truncate "+(on?"text-amber":"text-mute")}><bdi>{labels[k]}</bdi></div>
      <b dir="ltr" className={"block font-display text-[30px] leading-9 tabular-nums mt-1 "+(on?"text-amber":"text-[#C9CCE0]")}>{p[k]}%</b>
      {on?<div className="text-[10px] text-amber/90 mt-0.5">{t(lang,"viz.ai_pick")}</div>:<div className="h-[15px] mt-0.5" aria-hidden/>}
      <div className="h-1 rounded-full bg-line mt-1 overflow-hidden" aria-hidden><i className="block h-full rounded-full" style={{width:p[k]+"%",background:on?A:k==="h"?V:k==="a"?P:"#4A5273"}}/></div>
    </div>})}</div>;
}

/* ===== خط تحرك التوقع ===== */
export function Sparkline({vals,lang}:{vals:number[];lang:Lang}){
  if(vals.length<2)return null;
  const W=300,H=56,pad=4,lo=Math.max(0,Math.min(...vals)-5),hi=Math.min(100,Math.max(...vals)+5),rg=hi-lo||1;
  const pts=vals.map((v,i)=>[pad+i*(W-2*pad)/(vals.length-1),H-pad-(v-lo)/rg*(H-2*pad)] as [number,number]);
  const a=vals[0],b=vals[vals.length-1],txt=a===b?t(lang,"viz.steady",{a}):t(lang,"viz.moved",{a,b});const last=pts[pts.length-1];
  return <div className="mt-5 rounded-xl border border-line bg-bg/60 p-3">
    <div className="flex items-baseline justify-between gap-2 text-xs"><span className="text-mute">{t(lang,"viz.line")}</span><b className="text-white font-semibold">{txt}</b></div>
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14 mt-2" role="img" aria-label={txt} preserveAspectRatio="none" style={{direction:"ltr"}}>
      <path d={smooth(pts)+` L${last[0]},${H} L${pts[0][0]},${H} Z`} fill={A} opacity=".1"/>
      <path d={smooth(pts)} fill="none" stroke={A} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round"/>
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={A}/></svg>
    <div className="text-[10px] text-mute mt-1">{t(lang,"viz.line_n",{n:vals.length})}</div>
  </div>;
}

/* ===== رادار (SofaScore) ===== */
export type Axis={k:string;label:string;h:number;a:number};
export function Radar({axes,home,away,lang}:{axes:Axis[];home:string;away:string;lang:Lang}){
  if(axes.length<3)return null;
  const cx=130,cy=118,R0=82,n=axes.length;
  const pt=(i:number,v:number):[number,number]=>{const an=-Math.PI/2+i*2*Math.PI/n,r=R0*Math.max(0,Math.min(100,v))/100;return [r1(cx+r*Math.cos(an)),r1(cy+r*Math.sin(an))]};
  const poly=(f:(x:Axis)=>number)=>axes.map((x,i)=>pt(i,f(x)).join(",")).join(" ");
  const aria=t(lang,"viz.radar")+": "+axes.map(x=>`${x.label} ${home} ${Math.round(x.h)}، ${away} ${Math.round(x.a)}`).join("؛ ");
  return <svg viewBox="0 0 260 240" className="w-full max-w-[340px] mx-auto" role="img" aria-label={aria} style={{direction:"ltr"}}>
    {[25,50,75,100].map(l=><polygon key={l} points={axes.map((_,i)=>pt(i,l).join(",")).join(" ")} fill="none" stroke="#1E2436" strokeWidth="1"/>)}
    {axes.map((_,i)=>{const [x,y]=pt(i,100);return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#1E2436"/>})}
    <polygon points={poly(x=>x.h)} fill={V} fillOpacity=".22" stroke={V} strokeWidth="2" strokeLinejoin="round"/>
    <polygon points={poly(x=>x.a)} fill={P} fillOpacity=".18" stroke={P} strokeWidth="2" strokeLinejoin="round"/>
    {axes.map((x,i)=>{const [lx,ly]=pt(i,122);const anc=Math.abs(lx-cx)<8?"middle":lx>cx?"start":"end";
      return <text key={x.k} x={lx} y={ly+4} textAnchor={anc} fontSize="11" fill={M}>{x.label}</text>})}
  </svg>;
}

/* ===== أشرطة النِّسب (FBref) ===== */
export type PRow={label:string;h:number;a:number;hv?:string;av?:string;pctl?:boolean};
export function PercentileBars({rows,home,away,lang}:{rows:PRow[];home:string;away:string;lang:Lang}){
  if(!rows.length)return null;
  const bar=(v:number,c:string,txt:string)=><div className="min-w-0"><div className="h-2 rounded-full bg-bg overflow-hidden"><i className="block h-full rounded-full" style={{width:Math.max(2,Math.min(100,v))+"%",background:c}}/></div>
    <div className="text-[11px] text-[#C9CCE0] mt-1 truncate">{txt}</div></div>;
  return <div className="flex flex-col gap-4">{rows.map(r=><div key={r.label}>
    <div className="text-xs text-mute mb-1.5">{r.label}</div>
    <div className="grid grid-cols-2 gap-3">
      {bar(r.h,V,r.pctl?t(lang,"viz.above",{p:Math.round(r.h)}):(r.hv??Math.round(r.h)+"%"))}
      {bar(r.a,P,r.pctl?t(lang,"viz.above",{p:Math.round(r.a)}):(r.av??Math.round(r.a)+"%"))}
    </div></div>)}
    <div className="grid grid-cols-2 gap-3 text-[11px] -mt-1"><bdi className="text-violet truncate">{home}</bdi><bdi className="text-pink truncate">{away}</bdi></div>
  </div>;
}

/* ===== موجة الزخم (FotMob) ===== */
export function Momentum({res,color,name,lang}:{res:string[];color:"violet"|"pink";name:string;lang:Lang}){
  if(res.length<3)return null;
  const W=300,H=64,pad=6;let y=0;const ys=[0,...res.map(r=>(y+=r==="W"?1:r==="L"?-1:0))];
  const lo=Math.min(...ys,-1),hi=Math.max(...ys,1),rg=hi-lo;
  const pts=ys.map((v,i)=>[pad+i*(W-2*pad)/(ys.length-1),H-pad-(v-lo)/rg*(H-2*pad)] as [number,number]);
  const zero=H-pad-(0-lo)/rg*(H-2*pad),c=color==="violet"?V:P,gid="mw-"+color;
  const aria=`${t(lang,"viz.momentum")} · ${name}: `+res.map(r=>t(lang,("viz."+r) as "viz.W")).join(" ");
  return <div className="min-w-0"><div className={"text-xs mb-1 truncate "+(color==="violet"?"text-violet":"text-pink")}><bdi>{name}</bdi></div>
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" role="img" aria-label={aria} preserveAspectRatio="none" style={{direction:"ltr"}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c} stopOpacity=".35"/><stop offset="1" stopColor={c} stopOpacity="0"/></linearGradient></defs>
      <line x1="0" x2={W} y1={zero} y2={zero} stroke="#1E2436" strokeDasharray="3 3" vectorEffect="non-scaling-stroke"/>
      <path d={smooth(pts)+` L${W-pad},${H} L${pad},${H} Z`} fill={`url(#${gid})`}/>
      <path d={smooth(pts)} fill="none" stroke={c} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round"/>
      {pts.slice(1).map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={res[i]==="W"?"#5EC8B8":res[i]==="L"?P:M}/>)}
    </svg></div>;
}

/* ===== فقاعات الدوريات (FiveThirtyEight) ===== */
export type Bub={k:string;label:string;n:number;hit:number};
export function LeagueBubbles({data,lang}:{data:Bub[];lang:Lang}){
  const d=data.filter(x=>x.n>=5);if(d.length<2)return null;
  const W=340,H=230,L0=34,B0=196,T0=12,R0=W-12;
  const nMin=Math.min(...d.map(x=>x.n)),nMax=Math.max(...d.map(x=>x.n));
  const lx=(n:number)=>nMax===nMin?(L0+R0)/2:L0+(Math.log(n)-Math.log(nMin))/(Math.log(nMax)-Math.log(nMin))*(R0-L0-20)+10;
  const yLo=Math.max(0,Math.floor((Math.min(...d.map(x=>x.hit))-5)/10)*10),yHi=Math.min(100,Math.ceil((Math.max(...d.map(x=>x.hit))+5)/10)*10);
  const ly=(h:number)=>B0-(h-yLo)/((yHi-yLo)||1)*(B0-T0);
  const rad=(n:number)=>4+14*Math.sqrt(n/nMax);
  const worst=d.filter(x=>x.n>=10).sort((a,b)=>a.hit-b.hit)[0]||null;
  const lab=new Set([...d].sort((a,b)=>b.n-a.n).slice(0,4).map(x=>x.k));if(worst)lab.add(worst.k);
  const ticks=[yLo,(yLo+yHi)/2,yHi];
  const aria=t(lang,"viz.bubble")+": "+d.map(x=>`${x.label} ${x.n} / ${Math.round(x.hit)}%`).join("، ");
  return <div>
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={aria} style={{direction:"ltr"}}>
      {ticks.map(v=><g key={v}><line x1={L0} x2={R0} y1={ly(v)} y2={ly(v)} stroke="#1E2436"/><text x={L0-4} y={ly(v)+4} textAnchor="end" fontSize="10" fill={M}>{Math.round(v)}%</text></g>)}
      {[...d].sort((a,b)=>b.n-a.n).map(x=>{const w=worst?.k===x.k;const cx=lx(x.n),cy=ly(x.hit),r=rad(x.n);
        return <g key={x.k}><circle cx={cx} cy={cy} r={r} fill={w?R:V} fillOpacity={w?.55:.28} stroke={w?R:V} strokeWidth="1.5"/>
          {lab.has(x.k)&&<text x={cx} y={cy-r-4} textAnchor="middle" fontSize="10" fill={w?R:"#C9CCE0"}>{x.label.length>18?x.label.slice(0,17)+"…":x.label}</text>}</g>})}
      <text x={(L0+R0)/2} y={H-6} textAnchor="middle" fontSize="10" fill={M}>{t(lang,"viz.matches")} →</text>
    </svg>
    {worst&&<p className="text-sm mt-2" style={{color:R}}>{t(lang,"viz.worst",{l:worst.label,p:Math.round(worst.hit)})}</p>}
  </div>;
}
