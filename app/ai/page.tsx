// سجل الـ AI العلني: كل توقع مختوم ومحسوم، بلا انتقاء.
export const dynamic="force-dynamic";
import {db} from "@/lib/db";
export const metadata={title:"سجل الـ AI"};
type R={league:string;hit:boolean|null;brier:number|null;p_home:number;p_draw:number|null;p_away:number;outcome:string|null};
const NAMES:Record<string,string>={"eng.1":"الدوري الإنجليزي","esp.1":"الدوري الإسباني","ger.1":"الدوري الألماني","ita.1":"الدوري الإيطالي","fra.1":"الدوري الفرنسي","uefa.champions":"أبطال أوروبا","caf.champions":"أبطال أفريقيا","nba":"NBA"};
const pct=(a:number,b:number)=>b?Math.round(100*a/b):0;
export default async function AI(){
  const rows=(await db<R[]>("predictions?settled_at=not.is.null&void=eq.false&select=league,hit,brier,p_home,p_draw,p_away,outcome&order=settled_at.desc&limit=5000"))||[];
  const ok=rows.filter(r=>r.hit!==null);
  const n=ok.length,hits=ok.filter(r=>r.hit).length;
  const br=ok.filter(r=>r.brier!==null);const avgB=br.length?br.reduce((a,r)=>a+r.brier!,0)/br.length:null;
  // المرجع: نموذج "ما يعرف والو" يعطي 1/3 لكل نتيجة ← Brier = 0.667
  const by=new Map<string,R[]>();for(const r of ok){const k=r.league||"?";if(!by.has(k))by.set(k,[]);by.get(k)!.push(r)}
  const leagues=[...by.entries()].sort((a,b)=>b[1].length-a[1].length);
  // المعايرة: نجمع كل احتمال قاله النموذج في سلال 10%، ونقارن مع كم مرة صرا فعلا
  const sc=(x:number)=>x>1?x/100:x;
  const bins=Array.from({length:10},()=>({said:0,happened:0,n:0}));
  for(const r of ok){if(!r.outcome)continue;
    for(const [k,p] of [["home",r.p_home],["draw",r.p_draw],["away",r.p_away]] as [string,number|null][]){
      if(p===null)continue;const v=sc(p);const i=Math.min(9,Math.floor(v*10));
      bins[i].said+=v;bins[i].happened+=r.outcome===k?1:0;bins[i].n++}}
  return(<div className="flex flex-col gap-6">
   <section className="rounded-2xl bg-card border border-line p-7">
    <h1 className="text-3xl font-bold text-white">سجل الـ AI</h1>
    <p className="text-mute mt-2 leading-7">كل توقع مختوم قبل البداية ومحسوم بعد النهاية. ما نخبيو حتى غلطة.</p>
    {n===0?<p className="text-mute mt-6">مازال ما كاين توقعات محسومة.</p>:
    <dl className="grid grid-cols-3 gap-4 mt-6">
     <div><dt className="text-sm text-mute">مباريات محسومة</dt><dd className="text-3xl font-bold text-white mt-1" dir="ltr">{n}</dd></div>
     <div><dt className="text-sm text-mute">نسبة الإصابة</dt><dd className="text-3xl font-bold text-violet mt-1" dir="ltr">{pct(hits,n)}%</dd></div>
     <div><dt className="text-sm text-mute">Brier (أقل = أحسن)</dt><dd className="text-3xl font-bold text-white mt-1" dir="ltr">{avgB!==null?avgB.toFixed(3):"—"}</dd></div>
    </dl>}
    {avgB!==null&&<p className="text-sm text-mute mt-4 leading-7">للمقارنة: اللي يعطي 33% لكل نتيجة بلا ما يفكر ياخذ Brier ‎0.667. كل ما نقص الرقم، كل ما كانت الاحتمالات أصدق.</p>}
   </section>
   {leagues.length>0&&<section className="rounded-2xl bg-card border border-line p-7">
    <h2 className="text-lg font-semibold text-white mb-4">حسب الدوري</h2>
    <table className="w-full text-sm"><thead><tr className="text-mute text-right"><th className="font-normal pb-2">الدوري</th><th className="font-normal pb-2">مباريات</th><th className="font-normal pb-2">إصابة</th><th className="font-normal pb-2">Brier</th></tr></thead>
    <tbody>{leagues.map(([k,v])=>{const b=v.filter(r=>r.brier!==null);return <tr key={k} className="border-t border-line"><td className="py-2.5 text-white">{NAMES[k]||k}</td><td dir="ltr" className="text-right">{v.length}</td><td dir="ltr" className="text-right">{pct(v.filter(r=>r.hit).length,v.length)}%</td><td dir="ltr" className="text-right">{b.length?(b.reduce((a,r)=>a+r.brier!,0)/b.length).toFixed(3):"—"}</td></tr>})}</tbody></table>
   </section>}
   {n>0&&<section className="rounded-2xl bg-card border border-line p-7">
    <h2 className="text-lg font-semibold text-white mb-1">هل يصدق في احتمالاتو؟</h2>
    <p className="text-sm text-mute mb-5 leading-7">كي يقول الـ AI «60%»، لازم الحاجة تصرا قريب 6 مرات من 10. العمود الفاتح هو واش قال، والغامق هو واش صرا.</p>
    <div className="flex items-end gap-2 h-40" dir="ltr">{bins.map((b,i)=>{const s=b.n?b.said/b.n:0,h=b.n?b.happened/b.n:0;return <div key={i} className="flex-1 flex flex-col items-center gap-1">
      <div className="w-full flex items-end gap-[2px] h-32"><i className="flex-1 bg-violet/40 rounded-t" style={{height:(s*100)+"%"}}/><i className="flex-1 bg-violet rounded-t" style={{height:(h*100)+"%"}}/></div>
      <span className="text-[10px] text-mute">{i*10}%</span></div>})}</div>
    <p className="text-xs text-mute mt-3">السلال اللي فيها عينة صغيرة تتقلب بزاف، الصورة تصفى مع الوقت.</p>
   </section>}
  </div>);
}
