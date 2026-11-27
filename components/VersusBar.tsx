import type {Versus} from "@/lib/versus";
export default function VersusBar({v}:{v:Versus}){
  if(!v)return null;
  const lead=v.humans===v.ai?"تعادل هذا الأسبوع":v.humans>v.ai?"البشر قدّام هذا الأسبوع":"الآلة قدّام هذا الأسبوع";
  return(<section className="rounded-2xl bg-card border border-line p-5">
    <div className="flex items-baseline justify-between gap-3"><h2 className="text-lg font-semibold text-white">البشر ضد الآلة</h2><span className="text-sm text-mute">{lead}</span></div>
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div><div className="font-display text-4xl text-pink" dir="ltr">{v.humans}%</div><div className="text-sm text-mute mt-1">إصابة البشر · {v.picks} توقع</div></div>
      <div className="text-end"><div className="font-display text-4xl text-violet" dir="ltr">{v.ai}%</div><div className="text-sm text-mute mt-1">إصابة الـ AI · {v.matches} مباراة</div></div>
    </div>
    <p className="text-xs text-mute mt-4">آخر 7 أيام، على نفس المباريات فقط. كل توقع مختوم قبل البداية.</p>
  </section>);
}
