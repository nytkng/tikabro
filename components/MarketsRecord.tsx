import {marketsSummary} from "@/lib/goals";
const L={btts:"الزوج يسجلو (BTTS)",over25:"أكثر من 2.5 أهداف"} as const;
export default async function MarketsRecord(){
  const rows=(await marketsSummary())?.filter(r=>r.n>0);if(!rows?.length)return null;
  return <section className="mt-6"><h3 className="font-bold mb-2">سجل الأسواق</h3>
    <div className="grid grid-cols-2 gap-2">{rows.map(r=><div key={r.market} className="rounded-xl border p-3">
      <div className="text-sm text-mute">{L[r.market]}</div>
      <div className="text-2xl font-bold">{Math.round((r.hit_rate??0)*100)}%</div>
      <div className="text-xs text-mute">n={r.n} · Brier {(r.brier??0).toFixed(3)}</div></div>)}</div></section>;
}
