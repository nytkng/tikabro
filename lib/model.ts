// نموذج هدف v1 — يستعمل أفضل ما هو معروف عالميا ويبقى صادقا:
//  • كرة القدم: Dixon-Coles (توزيع Poisson للأهداف + تصحيح النتائج الصغيرة) من أهداف الفريق المسجلة/المستقبلة.
//  • بدونها: v0 على سجل الفوز/التعادل/الخسارة (مع فصل الأرض والخارج).
//  • السلة وغيرها بلا تعادل: لوجستي على قوة الفريقين + أفضلية الأرض.
// المرجع: Dixon & Coles (1997). تُقاس الجودة بـ Brier score على السجل المختوم.
export const MODEL_VERSION="v1-dc";
export type Rec={w:number;d:number;l:number};
export type Probs={h:number;d:number;a:number};
export type TeamGoals={gp:number;gf:number;ga:number};

const strength=(r:Rec)=>{const n=r.w+r.d+r.l;return (r.w+0.4*r.d+2)/(n+4)};
const pct=(h:number,d:number,a:number):Probs=>{
  const H=Math.round(h*100),D=Math.round(d*100);
  return {h:H,d:D,a:100-H-D};
};

// v0: سجل فقط
export function predict(home:Rec,away:Rec):Probs{
  const h=strength(home)+0.05,a=strength(away);
  const diff=h-a;
  const draw=Math.max(0.16,0.30-Math.abs(diff)*0.35);
  const rest=1-draw;
  const hh=Math.min(Math.max(rest*(0.5+diff*0.6),0.12),rest-0.12);
  return pct(hh,draw,rest-hh);
}

// رياضات بلا تعادل (سلة...)
export function predictTwoWay(home:Rec,away:Rec):Probs{
  const z=2.6*(strength(home)-strength(away))+0.28;
  const p=Math.min(0.92,Math.max(0.08,1/(1+Math.exp(-z))));
  const H=Math.round(p*100);
  return {h:H,d:0,a:100-H};
}

// Dixon-Coles
const fact=(n:number)=>{let r=1;for(let i=2;i<=n;i++)r*=i;return r};
const pois=(k:number,l:number)=>Math.exp(-l)*Math.pow(l,k)/fact(k);
const tau=(x:number,y:number,lh:number,la:number,rho:number)=>
  x===0&&y===0?1-lh*la*rho:x===0&&y===1?1+lh*rho:x===1&&y===0?1+la*rho:x===1&&y===1?1-rho:1;

/** league: متوسط الأهداف لكل فريق في المباراة (≈1.35). homeAdv: ≈1.25 مضاعف أهداف أصحاب الأرض. */
export function predictDC(h:TeamGoals,a:TeamGoals,league:{avg:number}={avg:1.35},homeAdv=1.15,rho=-0.1):Probs{
  // تلطيف: نخلط مع المتوسط بقدر 6 مباريات افتراضية حتى لا تبالغ العينات الصغيرة
  const K=12,avg=league.avg;
  const sm=(g:TeamGoals)=>({att:(g.gf+K*avg)/(g.gp+K)/avg,def:(g.ga+K*avg)/(g.gp+K)/avg});
  const H=sm(h),A=sm(a);
  const lh=Math.max(0.2,avg*H.att*A.def*homeAdv);
  const la=Math.max(0.2,avg*A.att*H.def/homeAdv*1.0);
  let ph=0,pd=0,pa=0,tot=0;
  for(let x=0;x<=9;x++)for(let y=0;y<=9;y++){
    const p=pois(x,lh)*pois(y,la)*tau(x,y,lh,la,rho);
    tot+=p;if(x>y)ph+=p;else if(x===y)pd+=p;else pa+=p;
  }
  return pct(ph/tot,pd/tot,pa/tot);
}
export const pickOf=(p:Probs)=>p.h>=p.a&&p.h>=p.d?"h":p.a>p.d?"a":"d";
