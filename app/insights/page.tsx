// رادار هدف: قراءة يومية للمباريات — مفاجآت، الجمهور ضد الـ AI، أوضح التوقعات، ودروس البارح. تحليل برك، ماشي رهان.
export const dynamic="force-dynamic";
import {getDay} from "@/lib/day";
import {db} from "@/lib/db";
import {currentPlayer} from "@/lib/auth";
import {pickOf} from "@/lib/model";
import type {Match} from "@/lib/types";
import {Section,RingCard,Teams,href} from "@/components/insights/Card";
export const metadata={title:"رادار هدف"};
const SP:Record<string,string>={football:"كرة القدم",basketball:"كرة السلة",hockey:"الهوكي",american:"كرة أمريكية",baseball:"البيسبول",rugby:"الرغبي",volleyball:"الطائرة",aussie:"كرة أسترالية",tennis:"التنس",handball:"اليد"};
const K={h:"home",d:"draw",a:"away"} as const;
const AR={home:"المستقبل",draw:"تعادل",away:"الضيف"} as const;
const dAt=(off:number)=>new Date(Date.now()+off*864e5).toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
const eidOf=(m:Match)=>m.id.split(":")[1]||"";
const side=(m:Match,k:"h"|"d"|"a")=>k==="h"?m.home:k==="a"?m.away:"تعادل";
export default async function Insights(){
  const [today,tomorrow,yesterday,me]=await Promise.all([getDay(dAt(0)),getDay(dAt(1)),getDay(dAt(-1)),currentPlayer()]);
  const real=(l:Match[])=>l.filter(m=>!m.sample);
  const now=Date.now();
  const upcoming=real([...today,...tomorrow]).filter(m=>m.state==="pre"&&m.probs&&Date.parse(m.kickoff)>now);
  // 1. مفاجآت محتملة: المرشح تحت 55% والفرق صغير
  const upsets=upcoming.map(m=>{const p=m.probs!,fav=Math.max(p.h,p.a),dog=Math.min(p.h,p.a);return {m,fav,gap:fav-dog}})
    .filter(x=>x.fav<55&&x.gap<=12).sort((a,b)=>a.gap-b.gap).slice(0,8);
  // 3. أوضح توقعات
  const clear=[...upcoming].sort((a,b)=>{const pa=a.probs!,pb=b.probs!;return pb[pickOf(pb)]-pa[pickOf(pa)]}).slice(0,6);
  // 2. الجمهور ضد الـ AI
  const pool=[...upcoming].sort((a,b)=>a.kickoff.localeCompare(b.kickoff)).filter(m=>/^\d+$/.test(eidOf(m))).slice(0,150);
  const ids=pool.map(eidOf);
  const [rows,mine]=ids.length?await Promise.all([
    db<{match_id:string;pick:"home"|"draw"|"away"}[]>(`picks?match_id=in.(${ids.join(",")})&void=not.is.true&select=match_id,pick&limit=20000`).catch(()=>null),
    me?db<{match_id:string}[]>(`picks?player_id=eq.${me.id}&match_id=in.(${ids.join(",")})&select=match_id&limit=200`).catch(()=>null):Promise.resolve(null)]):[null,null];
  const cnt=new Map<string,{home:number;draw:number;away:number}>();
  for(const r of rows||[]){const c=cnt.get(r.match_id)||{home:0,draw:0,away:0};if(r.pick in c)c[r.pick]++;cnt.set(r.match_id,c)}
  const picked=new Set((mine||[]).map(r=>r.match_id));
  const clash=pool.flatMap(m=>{const c=cnt.get(eidOf(m));if(!c)return [];const n=c.home+c.draw+c.away;if(n<3)return [];
    const cr=(["home","draw","away"] as const).reduce((a,k)=>c[k]>c[a]?k:a,"home" as "home"|"draw"|"away");
    const ai=K[pickOf(m.probs!)];return cr!==ai?[{m,c,n,cr,ai}]:[]}).sort((a,b)=>b.n-a.n).slice(0,8);
  // 4. مفاجآت البارح
  const shocks=real(yesterday).filter(m=>m.state==="post"&&m.probs&&m.score).flatMap(m=>{const p=m.probs!,k=pickOf(p);if(k==="d"||p[k]<60)return [];
    const [h,a]=m.score!;const won=k==="h"?h>a:a>h;return won?[]:[{m,k:k as "h"|"a",pr:p[k]}]}).sort((a,b)=>b.pr-a.pr).slice(0,8);
  // 5. نبض المباشر
  const live=real(today).filter(m=>m.state==="live");
  const bySport=Object.entries(live.reduce<Record<string,number>>((o,m)=>(o[m.sport]=(o[m.sport]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]);
  return(<div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 flex flex-col gap-5">
    <header className="stage relative overflow-hidden rounded-3xl p-5 sm:p-7">
      <h1 className="font-display text-[28px] sm:text-[34px] text-white relative">رادار هدف</h1>
      <p className="text-[14px] text-[#C9CCE0] mt-1 relative">قراءة سريعة لليوم: وين تقدر تصرا المفاجأة، وين الجمهور ما يتفقش مع الـ AI، وواش علّمنا البارح.</p>
      <div className="flex flex-wrap gap-2 mt-4 relative">
        {live.length?<><span className="chip on-pink"><i className="live-dot !mb-0"/>{live.length} مباشر دركا</span>{bySport.map(([s,n])=><a key={s} href="/" className="chip">{SP[s]||s} <b className="tabular-nums">{n}</b></a>)}</>
        :<span className="chip">ما كاين حتى ماتش مباشر دركا</span>}
      </div>
    </header>
    <Section title="مفاجآت محتملة" sub="ماتشات قريبة فيها الـ AI يعطي للأضعف حظ حقيقي: المرشح تحت 55% والفرق صغير." n={upsets.length}>
      <div className="grid sm:grid-cols-2 gap-2">{upsets.map(({m,gap})=><RingCard key={m.id} m={m} note={<>الفرق بين الفريقين غير <b className="text-[#FFB020] tabular-nums" dir="ltr">{gap}%</b></>}/>)}</div>
    </Section>
    <Section title="الجمهور ضد الـ AI" sub="أغلبية اللاعبين اختارو حاجة والـ AI اختار حاجة أخرى. الأرقام تبانلك غير بعد ما تدير توقعك." n={clash.length}>
      <div className="flex flex-col gap-2">{clash.map(({m,c,n,cr,ai})=>{const show=picked.has(eidOf(m));const nm=(k:"home"|"draw"|"away")=>k==="home"?m.home:k==="away"?m.away:"تعادل";
        return(<a key={m.id} href={href(m)} className="mrow flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <Teams m={m}/>
          <span className="shrink-0 w-[132px] flex flex-col gap-1 text-[12px]">
            <span className="ai-chip"><span className="opacity-70">AI</span><bdi className="truncate">{nm(ai)}</bdi></span>
            {show?<span className="text-[#C9CCE0]">الجمهور: <bdi>{nm(cr)}</bdi> <b className="tabular-nums" dir="ltr">{Math.round(100*c[cr]/n)}%</b><span className="text-mute block">{n} توقع · {AR[cr]}</span></span>
              :<span className="text-pink font-semibold">⚡ اختلاف — توقع باش تشوف</span>}
          </span></a>)})}</div>
    </Section>
    <Section title="أوضح توقعات اليوم" sub="الماتشات اللي الـ AI واثق فيها أكثر. الثقة ماشي ضمان." n={clear.length}>
      <div className="grid sm:grid-cols-2 gap-2">{clear.map(m=><RingCard key={m.id} m={m} note={<>الـ AI يميل لـ <bdi className="text-white">{side(m,pickOf(m.probs!))}</bdi></>}/>)}</div>
    </Section>
    <Section title="مفاجآت البارح" sub="ماتشات كان فيها الـ AI مرشّح فريق بـ 60% ولا أكثر، وخسر. الكورة ما فيهاش مضمون." n={shocks.length}>
      <div className="flex flex-col gap-2">{shocks.map(({m,k,pr})=><a key={m.id} href={href(m)} className="mrow flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <Teams m={m}/><span className="shrink-0 ai-chip miss">AI <bdi>{side(m,k)}</bdi> <b dir="ltr">{pr}%</b></span></a>)}</div>
    </Section>
  </div>);
}
