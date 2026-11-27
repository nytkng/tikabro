// نموذج v0 بسيط وصادق: يعتمد فقط على سجل الفريقين (فوز-تعادل-خسارة) + أفضلية الأرض.
// لا يدعي دقة غير مثبتة. يُستبدل بـ Dixon-Coles بعد قياس Brier على السجل المختوم.
export const MODEL_VERSION="v0-record";
export type Rec={w:number;d:number;l:number};
const strength=(r:Rec)=>{const n=r.w+r.d+r.l;return n?(r.w+0.4*r.d+0.5)/(n+1.2):0.5};
export function predict(home:Rec,away:Rec){
  const h=strength(home)*1.12,a=strength(away);
  const diff=h-a;
  const draw=Math.max(0.16,0.30-Math.abs(diff)*0.35);
  const rest=1-draw;
  const ph=rest*(0.5+diff*0.9);
  const hh=Math.min(Math.max(ph,0.05),rest-0.05);
  const r=(x:number)=>Math.round(x*100);
  const H=r(hh),D=r(draw);
  return {h:H,d:D,a:100-H-D};
}
export const pickOf=(p:{h:number;d:number;a:number})=>p.h>=p.a&&p.h>=p.d?"h":p.a>p.d?"a":"d";
