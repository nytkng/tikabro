// بطاقة «علاش؟»: تشرح توقع الـ AI في جمل بسيطة، من نفس الأرقام اللي يستعملها النموذج.
import {db} from "@/lib/db";
import {teamIds} from "@/lib/feed";
import type {Match} from "@/lib/types";
import {t,type Lang} from "@/lib/i18n";
const rec=(s?:string|null)=>{if(!s||!/^\d+(-\d+){1,2}$/.test(s))return null;const a=s.split("-").map(Number);return a.length===3?{w:a[0],d:a[1],l:a[2]}:{w:a[0],d:0,l:a[1]}};
export default async function WhyCard({m,sportPath,eid,lang="ar"}:{m:Match;sportPath:string;eid:string;lang?:Lang}){
  const p=m.probs;if(!p)return null;
  const ids=await teamIds(eid).catch(()=>null);
  let eh:number|null=null,ea:number|null=null,nh=0,na=0;
  if(ids){const r=await db<{key:string;elo:number;n:number}[]>(`team_ratings?key=in.(${encodeURIComponent(`"${sportPath}:${ids.h}","${sportPath}:${ids.a}"`)})&select=key,elo,n`);
    for(const x of r||[]){if(x.key.endsWith(":"+ids.h)){eh=x.elo;nh=x.n}else{ea=x.elo;na=x.n}}}
  const lines:string[]=[];
  const fav=p.h>=p.a?m.home:m.away,dog=p.h>=p.a?m.away:m.home,fp=Math.max(p.h,p.a);
  if(eh!==null&&ea!==null&&nh>=3&&na>=3){const g=Math.round(Math.abs(eh-ea));const up=eh>=ea?m.home:m.away;
    lines.push(g<25?t(lang,"w.even",{g}):t(lang,"w.elo",{t:up,g,n:Math.min(nh,na)}))}
  const rh=rec(m.homeRec),ra=rec(m.awayRec);
  const fmt=(r:{w:number;d:number;l:number})=>r.d?t(lang,"w.rec_d",r):t(lang,"w.rec",r);
  if(rh&&ra)lines.push(t(lang,"w.season",{h:m.home,rh:fmt(rh),a:m.away,ra:fmt(ra)}));
  lines.push(t(lang,"w.home",{t:m.home}));
  if(p.d>=28)lines.push(t(lang,"w.drawy",{p:p.d}));
  else if(fp<50)lines.push(t(lang,"w.open",{f:fav,p:fp,d:dog}));
  else lines.push(t(lang,"w.fav",{f:fav,p:fp,n:Math.round((100-fp)/10)}));
  return(<section className="panel invite p-5">
    <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2"><i aria-hidden className="w-1.5 h-5 rounded-full bg-draw"/>{t(lang,"w.title")}</h2>
    <ol className="steps flex flex-col gap-4 text-sm text-[#C9CCE0] leading-7">{lines.slice(0,4).map((t,i)=><li key={i}><b>{i+1}</b><span className="pt-0.5">{t}</span></li>)}</ol>
    <p className="text-xs text-mute mt-3">{t(lang,"w.note")}</p>
  </section>);
}
