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

export type Ext={
  xg:{h:number;a:number};
  dc:{x1:number;x12:number;x2:number};      // فرصة مزدوجة: 1X / 12 / X2
  btts:{yes:number;no:number};              // كلا الفريقين يسجلان
  ou:{line:number;over:number;under:number}[];
  tg:{h:{o05:number;o15:number};a:{o05:number;o15:number}}; // أهداف كل فريق
  scores:{s:string;p:number}[];            // أرجح النتائج
};
const lam=(h:TeamGoals,a:TeamGoals,avg:number,homeAdv:number)=>{
  // تلطيف: نخلط مع المتوسط بقدر 12 مباراة افتراضية حتى لا تبالغ العينات الصغيرة
  const K=12,sm=(g:TeamGoals)=>({att:(g.gf+K*avg)/(g.gp+K)/avg,def:(g.ga+K*avg)/(g.gp+K)/avg});
  const H=sm(h),A=sm(a);
  return {lh:Math.max(0.2,avg*H.att*A.def*homeAdv),la:Math.max(0.2,avg*A.att*H.def/homeAdv)};
};
function grid(lh:number,la:number,rho:number){
  const g:number[][]=[];let tot=0;
  for(let x=0;x<=9;x++){g[x]=[];for(let y=0;y<=9;y++){const p=pois(x,lh)*pois(y,la)*tau(x,y,lh,la,rho);g[x][y]=p;tot+=p}}
  for(const r of g)for(let y=0;y<r.length;y++)r[y]/=tot;
  return g;
}
const P=(x:number)=>Math.round(x*100);
/** Dixon-Coles: يرجع الفائز وكل الأسواق من نفس شبكة النتائج. league.avg: متوسط أهداف الفريق في المباراة (≈1.35). */
export function predictDCFull(h:TeamGoals,a:TeamGoals,league:{avg:number}={avg:1.35},homeAdv=1.15,rho=-0.1):{p:Probs;ext:Ext}{
  const {lh,la}=lam(h,a,league.avg,homeAdv);
  const g=grid(lh,la,rho);
  let ph=0,pd=0,pa=0,by=0;const tot:number[]=Array(20).fill(0);const hg:number[]=Array(10).fill(0),ag:number[]=Array(10).fill(0);
  const sc:{s:string;p:number}[]=[];
  for(let x=0;x<=9;x++)for(let y=0;y<=9;y++){
    const p=g[x][y];
    if(x>y)ph+=p;else if(x===y)pd+=p;else pa+=p;
    if(x>0&&y>0)by+=p;
    tot[x+y]+=p;hg[x]+=p;ag[y]+=p;sc.push({s:`${x}-${y}`,p});
  }
  const over=(l:number)=>tot.reduce((acc,v,i)=>acc+(i>l?v:0),0);
  const ext:Ext={
    xg:{h:Math.round(lh*10)/10,a:Math.round(la*10)/10},
    dc:{x1:P(ph+pd),x12:P(ph+pa),x2:P(pd+pa)},
    btts:{yes:P(by),no:100-P(by)},
    ou:[1.5,2.5,3.5].map(l=>({line:l,over:P(over(l)),under:100-P(over(l))})),
    tg:{h:{o05:P(1-hg[0]),o15:P(1-hg[0]-hg[1])},a:{o05:P(1-ag[0]),o15:P(1-ag[0]-ag[1])}},
    scores:sc.sort((a,b)=>b.p-a.p).slice(0,3).map(x=>({s:x.s,p:P(x.p)})),
  };
  return {p:pct(ph,pd,pa),ext};
}
export const predictDC=(h:TeamGoals,a:TeamGoals,league:{avg:number}={avg:1.35},homeAdv=1.15,rho=-0.1)=>predictDCFull(h,a,league,homeAdv,rho).p;
export const pickOf=(p:Probs)=>p.h>=p.a&&p.h>=p.d?"h":p.a>p.d?"a":"d";
