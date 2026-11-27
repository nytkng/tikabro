import {t,type Lang} from "@/lib/i18n";
/* أرضية الملعب: تشكيلة الفريقين (SVG يدوي، بلا مكتبات وبلا صور لاعبين) */
export type PP={n:string;sn:string;j:string;pos:string;fp:number;st:boolean;g:number;yc:number;rc:number;off:boolean;on:boolean};
export type Team={name:string;f?:string;p:PP[];bench:PP[];coach?:string};

const W=340,H=540,M=12,MID=H/2;
// العمق من رمز المركز: 0 حارس … 6 رأس حربة
function depth(a:string):number{const p=a.toUpperCase();
 if(p==="G"||p==="GK")return 0;if(/WB/.test(p))return 1.5;if(/^(CD|CB|SW|D|LB|RB)/.test(p))return 1;
 if(/^DM/.test(p))return 2;if(/^AM/.test(p))return 4;if(/^(LM|RM|CM|M)/.test(p))return 3;
 if(/^(LW|RW|W)/.test(p))return 5;if(/^(F|CF|ST|S|LF|RF)/.test(p))return 6;return 3}
// الجانب: -1 يمين اللاعب، +1 يساره
const lat=(a:string)=>{const p=a.toUpperCase();return /-R$|^R/.test(p)?-1:/-L$|^L/.test(p)?1:0};
export const lastName=(x:PP)=>{const s=(x.sn||x.n).replace(/^(\S{1,2}\.\s*)+/,"").trim();return s||x.n};
const cut=(s:string,n=11)=>s.length>n?s.slice(0,n-1)+"…":s;

/* يقسم الأساسيين إلى صفوف حسب الخطة (أول صف = الحارس) */
export function rows(team:Team):PP[][]{
 const p=[...team.p].sort((a,b)=>(a.fp||99)-(b.fp||99));if(!p.length)return[];
 const lines=(team.f||"").split("-").map(Number).filter(n=>n>0);
 const sum=lines.reduce((a,b)=>a+b,0);
 const hasFp=p.every(x=>x.fp>0);
 const gk=p.find(x=>depth(x.pos)===0)||(hasFp?p.find(x=>x.fp===1):undefined)||p[0];
 const rest=p.filter(x=>x!==gk).sort((a,b)=>depth(a.pos)-depth(b.pos)||(a.fp||99)-(b.fp||99));
 const cnt=sum===rest.length?lines:fallback(rest);
 const out:PP[][]=[[gk]];let i=0;
 for(const c of cnt){out.push(rest.slice(i,i+c).sort((a,b)=>lat(a.pos)-lat(b.pos)||(a.fp-b.fp)));i+=c}
 return out}
function fallback(r:PP[]):number[]{const m=new Map<number,number>();for(const x of r){const d=Math.round(depth(x.pos));m.set(d,(m.get(d)||0)+1)}
 return[...m.entries()].sort((a,b)=>a[0]-b[0]).map(e=>e[1])}

function Player({x,y,p,c}:{x:number;y:number;p:PP;c:string}){
 return <g transform={`translate(${x} ${y})`}>
  <circle r="13" fill={c} stroke="#0B0D14" strokeWidth="2"/>
  <circle r="13" fill="none" stroke="#fff" strokeOpacity=".25"/>
  <text y="4.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0B0D14" style={{fontFamily:"var(--font-sans)"}}>{p.j}</text>
  <text y="27" textAnchor="middle" fontSize="9.5" fill="#E8EAF2" direction="ltr" paintOrder="stroke" stroke="#0B0D14" strokeWidth="3" strokeOpacity=".7" style={{fontFamily:"var(--font-sans)"}}>{cut(lastName(p))}</text>
  {p.g>0&&<g transform="translate(11 -11)"><circle r="6" fill="#fff" stroke="#0B0D14"/><path d="M0-2.6l2.5 1.8-1 2.9h-3l-1-2.9z" fill="#0B0D14"/>{p.g>1&&<text x="8" y="3" fontSize="8" fill="#fff" fontWeight="700">{p.g}</text>}</g>}
  {(p.rc>0||p.yc>0)&&<rect x="-17" y="-17" width="6" height="8.5" rx="1" fill={p.rc>0?"#E5484D":"#FFD43B"} stroke="#0B0D14" strokeWidth=".8"/>}
  {p.off&&<g transform="translate(11 9)"><circle r="5.5" fill="#0B0D14"/><path d="M0-3v5M-2.6 0.4L0 3l2.6-2.6" stroke="#E5484D" strokeWidth="1.6" fill="none" strokeLinecap="round"/></g>}
 </g>}

export default function Pitch({home,away,lang}:{home:Team;away:Team;lang:Lang}){
 const hr=rows(home),ar=rows(away);
 const place=(rs:PP[][],top:boolean,c:string)=>rs.map((row,ri)=>{
  const n=rs.length;const yIn=n>1?ri/(n-1):0;// 0 = الحارس
  const y=top?M+26+yIn*(MID-M-58):H-M-26-yIn*(MID-M-58);
  const ord=top?row:[...row].reverse();// المضيف يهاجم للفوق: يسار اللاعب = يسار الشاشة
  return ord.map((p,k)=><Player key={p.j+p.n} x={M+(k+.5)*(W-2*M)/ord.length} y={y} p={p} c={c}/>)});
 const stripes=Array.from({length:10},(_,i)=>i);
 const bw=150,bh=62,sw=66,sh=22,pw=W-2*M,ph=H-2*M;
 const lab=(x:Team)=>`${x.name}${x.f?" "+x.f:""}`;
 const badges=(p:PP)=>[p.g>0?t(lang,"pitch.goal")+(p.g>1?" ×"+p.g:""):"",p.yc>0?t(lang,"pitch.yc"):"",p.rc>0?t(lang,"pitch.rc"):"",p.off?t(lang,"pitch.off"):"",p.on?t(lang,"pitch.in"):""].filter(Boolean).join("، ");
 return <div className="min-w-0">
  <div className="flex justify-between items-center text-sm mb-2 text-pink"><span className="font-semibold truncate"><bdi>{away.name}</bdi></span>{away.f&&<bdi dir="ltr" className="text-amber tabular-nums text-xs">{away.f}</bdi>}</div>
  <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px] mx-auto block rounded-2xl" role="img" aria-label={t(lang,"pitch.aria",{h:home.name,hf:home.f||"-",a:away.name,af:away.f||"-"})}>
   <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0E2A2E"/><stop offset=".5" stopColor="#123A2F"/><stop offset="1" stopColor="#0F2236"/></linearGradient></defs>
   <rect width={W} height={H} rx="16" fill="url(#pg)"/>
   {stripes.map(i=>i%2===0&&<rect key={i} x={M} y={M+i*ph/10} width={pw} height={ph/10} fill="#fff" fillOpacity=".025"/>)}
   <g fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1.5">
    <rect x={M} y={M} width={pw} height={ph} rx="2"/>
    <line x1={M} y1={MID} x2={W-M} y2={MID}/><circle cx={W/2} cy={MID} r="42"/>
    <rect x={(W-bw)/2} y={M} width={bw} height={bh}/><rect x={(W-sw)/2} y={M} width={sw} height={sh}/>
    <rect x={(W-bw)/2} y={H-M-bh} width={bw} height={bh}/><rect x={(W-sw)/2} y={H-M-sh} width={sw} height={sh}/>
    <path d={`M${W/2-30} ${M+bh}A40 40 0 0 0 ${W/2+30} ${M+bh}`}/><path d={`M${W/2-30} ${H-M-bh}A40 40 0 0 1 ${W/2+30} ${H-M-bh}`}/>
   </g>
   <g fill="#fff" fillOpacity=".35"><circle cx={W/2} cy={MID} r="2.5"/><circle cx={W/2} cy={M+44} r="2"/><circle cx={W/2} cy={H-M-44} r="2"/></g>
   {place(ar,true,"#E879A6")}{place(hr,false,"#8B7CFF")}
  </svg>
  <div className="flex justify-between items-center text-sm mt-2 text-violet"><span className="font-semibold truncate"><bdi>{home.name}</bdi></span>{home.f&&<bdi dir="ltr" className="text-amber tabular-nums text-xs">{home.f}</bdi>}</div>
  <div className="sr-only">{[home,away].map((x,i)=><ul key={i} aria-label={lab(x)}>{x.p.map((p,k)=><li key={k}><bdi>{p.j} {p.n}</bdi>{badges(p)?" — "+badges(p):""}</li>)}</ul>)}</div>

  {(home.bench.length+away.bench.length>0||home.coach||away.coach)&&<div className="grid grid-cols-2 gap-4 mt-5">{[home,away].map((x,i)=><div key={i} className="min-w-0">
   <div className={"text-xs mb-2 truncate "+(i===0?"text-violet":"text-pink")}>{t(lang,"pitch.subs")} · <bdi>{x.name}</bdi></div>
   <ul className="flex flex-col gap-1.5">{x.bench.map((p,k)=><li key={k} className="flex items-center gap-2 text-sm min-w-0">
    <span className={"w-6 h-6 flex-none rounded-md flex items-center justify-center text-xs font-bold tabular-nums border "+(i===0?"border-violet text-violet":"border-pink text-pink")}>{p.j}</span>
    <span className={"truncate min-w-0 flex-1 "+(p.on?"text-white":"text-mute")}><bdi>{lastName(p)}</bdi></span>
    {p.on&&<span className="text-teal text-xs flex-none" aria-label={t(lang,"pitch.in")}>↑</span>}{p.g>0&&<span className="text-xs flex-none" aria-label={t(lang,"pitch.goal")}>⚽</span>}
    {(p.rc>0||p.yc>0)&&<i aria-label={t(lang,p.rc>0?"pitch.rc":"pitch.yc")} className={"w-2 h-3 rounded-[2px] flex-none "+(p.rc>0?"bg-[#E5484D]":"bg-[#FFD43B]")}/>}</li>)}</ul>
   {x.coach&&<div className="text-xs text-mute mt-3 truncate">{t(lang,"pitch.coach")}: <bdi className="text-white">{x.coach}</bdi></div>}</div>)}</div>}
 </div>}
