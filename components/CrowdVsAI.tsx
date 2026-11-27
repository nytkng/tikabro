// الجمهور ضد الـ AI: يتخبى الجمهور حتى تختم توقعك، باش يبقى توقعك مستقل (ماشي تقليد).
type K="home"|"draw"|"away";
export default function CrowdVsAI({home,away,hasDraw,counts,ai,mine,revealed,outcome}:{home:string;away:string;hasDraw:boolean;counts:Record<K,number>;ai:K|null;mine:K|null;revealed:boolean;outcome:K|null}){
  const n=counts.home+counts.draw+counts.away;
  const pc=(k:K)=>n?Math.round(counts[k]*100/n):0;
  const top:K|null=n?(["home","draw","away"] as K[]).reduce((a,b)=>counts[b]>counts[a]?b:a,"home"):null;
  const name=(k:K|null)=>k==="home"?`فوز ${home}`:k==="away"?`فوز ${away}`:k==="draw"?"تعادل":"—";
  const mark=(k:K|null)=>outcome&&k?(k===outcome?" ✓":" ✗"):"";
  return(<section className="rounded-[20px] bg-surface border border-line p-7">
    <h2 className="text-lg font-semibold text-white mb-1">الجمهور ضد الـ AI</h2>
    {!revealed?<p className="text-sm text-mute">{n?`${n} لاعب ختمو توقعاتهم. `:""}رأي الجمهور يتخبى حتى تختم توقعك، باش يبقى قرارك نتاعك.</p>
    :n===0?<p className="text-sm text-mute">ماكانش توقعات من الجمهور في هذي المباراة.</p>
    :<>
      <p className="text-sm text-mute mb-4">{n} لاعب{outcome?"، والنتيجة خرجت":""}.</p>
      <div className="flex h-3 rounded-full overflow-hidden gap-[3px]"><i style={{width:pc("home")+"%"}} className="bg-violet"/>{hasDraw&&pc("draw")>0&&<i style={{width:pc("draw")+"%"}} className="bg-[#4A5273]"/>}<i style={{width:pc("away")+"%"}} className="bg-pink"/></div>
      <div className="flex justify-between text-sm mt-2"><span>{home} <bdi dir="ltr">{pc("home")}%</bdi></span>{hasDraw&&<span>تعادل <bdi dir="ltr">{pc("draw")}%</bdi></span>}<span>{away} <bdi dir="ltr">{pc("away")}%</bdi></span></div>
      <dl className="grid grid-cols-3 gap-3 mt-5 text-center">
        <div className="rounded-xl border border-line p-3"><dt className="text-xs text-mute">الـ AI</dt><dd className="text-white font-semibold mt-1">{name(ai)}{mark(ai)}</dd></div>
        <div className="rounded-xl border border-line p-3"><dt className="text-xs text-mute">أغلبية الجمهور</dt><dd className="text-white font-semibold mt-1">{name(top)}{mark(top)}</dd></div>
        <div className="rounded-xl border border-line p-3"><dt className="text-xs text-mute">أنت</dt><dd className="text-white font-semibold mt-1">{name(mine)}{mark(mine)}</dd></div>
      </dl>
      {!outcome&&ai&&top&&<p className="text-sm text-mute mt-4">{ai===top?"الجمهور متفق مع الـ AI في هذي.":"الجمهور ضد الـ AI في هذي. نشوفو شكون يصيب."}</p>}
    </>}
  </section>);
}
