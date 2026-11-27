// بعد المباراة: علاش غلط الـ AI ولا علاش صاب، بالأرقام وبلا تبرير.
import {db} from "@/lib/db";
import {t,type Lang} from "@/lib/i18n";
import type {Match} from "@/lib/types";
type K="home"|"draw"|"away";
export default async function PostMortem({m,outcome,lang="ar"}:{m:Match;outcome:K|null;lang?:Lang}){
  const p=m.probs;if(!p||!outcome)return null;
  const v:{k:K;p:number}[]=([{k:"home",p:p.h},{k:"draw",p:p.d||0},{k:"away",p:p.a}] as {k:K;p:number}[]);
  const top=v.reduce((a,b)=>b.p>a.p?b:a),po=v.find(x=>x.k===outcome)!.p,hit=top.k===outcome;
  const name=(k:K)=>k==="home"?m.home:k==="away"?m.away:t(lang,"draw");
  const lines:string[]=[];
  if(hit){lines.push(top.p>=60?t(lang,"pm.easy",{p:top.p}):t(lang,"pm.brave",{p:top.p}))}
  else{lines.push(t(lang,"pm.gave",{p:po,n:Math.max(1,Math.round(po/10))}));
    if(outcome==="draw")lines.push(t(lang,"pm.draw"));
    else if(po<25)lines.push(t(lang,"pm.upset"));
    else if(top.p<50)lines.push(t(lang,"pm.close",{p:top.p}));
    else lines.push(t(lang,"pm.wrong",{t:name(top.k),p:top.p}))}
  const bins=await db<{bin:number;said:number;happened:number;n:number}[]>("rpc/ai_calibration",{method:"POST",body:"{}"}).catch(()=>null);
  const b=(bins||[]).find(x=>Number(x.bin)===Math.min(9,Math.floor(top.p/10)));
  const f=(x:number)=>Math.round(x>1?x:x*100);
  if(b&&b.n>=10)lines.push(t(lang,"pm.calib",{s:f(b.said),h:f(b.happened),n:b.n}));
  if(!hit)lines.push(t(lang,"pm.learn"));
  return(<section className="panel p-5">
    <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2"><i aria-hidden className={"w-1.5 h-5 rounded-full "+(hit?"bg-win":"bg-loss")}/>{t(lang,hit?"pm.title_hit":"pm.title_miss")}</h2>
    <ul className="flex flex-col gap-3 text-sm text-[#C9CCE0] leading-7">{lines.map((x,i)=><li key={i}>{x}</li>)}</ul>
  </section>);
}
