// صفحة التحقق: السلسلة المشفّرة للتوقعات + الجذور اليومية المختومة في OpenTimestamps
export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import {getLang} from "@/lib/lang";
import {t,dirOf} from "@/lib/i18n";
import Recompute from "@/components/ledger/Recompute";
export const metadata={title:"تحقّق بنفسك"};
type L={seq:number;match_id:string;payload:string;entry_hash:string;prev_hash:string;created_at:string};
type D={day:string;last_seq:number|null;root_hash:string|null;ots_proof:string|null};

export default async function Verify({searchParams}:{searchParams:Promise<{q?:string}>}){
  const l=await getLang();const {q:raw}=await searchParams;const q=(raw||"").trim();
  let e:L|null=null;
  if(q){
    const f=/^[0-9a-f]{64}$/i.test(q)?`entry_hash=eq.${q.toLowerCase()}`:`match_id=eq.${encodeURIComponent(q)}`;
    e=(await db<L[]>(`ledger_entries?${f}&select=seq,match_id,payload,entry_hash,prev_hash,created_at&limit=1`))?.[0]??null;
  }
  const roots=(await db<D[]>("daily_roots?select=day,last_seq,root_hash,ots_proof&order=day.desc&limit=30"))||[];
  const recent=(await db<L[]>("ledger_entries?select=seq,match_id,entry_hash,created_at&order=seq.desc&limit=5"))||[];
  const kick=e?.payload.split("|")[2];
  const mins=e&&kick?Math.round((Date.parse(kick)-Date.parse(e.created_at))/60000):null;
  const box="rounded-xl border border-white/10 p-4 space-y-2";
  return <main dir={dirOf(l)} className="mx-auto max-w-3xl p-4 space-y-6">
    <h1 className="text-2xl font-bold">{t(l,"ledger.title")}</h1>
    <section className={box}>
      <p>{t(l,"ledger.p1")}</p><p>{t(l,"ledger.p2")}</p><p>{t(l,"ledger.p3")}</p>
      <code dir="ltr" className="block text-xs opacity-70">entry_hash = sha256(prev_hash + "|" + payload)</code>
    </section>
    <form className="flex gap-2">
      <input name="q" defaultValue={q} dir="ltr" placeholder={t(l,"ledger.ph")} className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"/>
      <button className="rounded-lg bg-white/10 px-4">{t(l,"ledger.go")}</button>
    </form>
    {q&&!e&&<p className="opacity-70">{t(l,"ledger.none")}</p>}
    {e&&<section className={box}>
      <div>#{e.seq} · <b dir="ltr">{e.match_id}</b></div>
      {mins!=null&&<div className="font-bold">{mins>=0?t(l,"ledger.before",{m:mins}):t(l,"ledger.after",{m:-mins})}</div>}
      <div className="text-sm opacity-70">payload</div><code dir="ltr" className="block break-all text-xs">{e.payload}</code>
      <div className="text-sm opacity-70">prev_hash</div><code dir="ltr" className="block break-all text-xs">{e.prev_hash}</code>
      <div className="text-sm opacity-70">entry_hash</div><code dir="ltr" className="block break-all text-xs">{e.entry_hash}</code>
      <div className="text-sm opacity-70">created_at: <span dir="ltr">{e.created_at}</span></div>
      <Recompute prev={e.prev_hash} payload={e.payload} hash={e.entry_hash} labels={{calc:t(l,"ledger.calc"),ok:t(l,"ledger.ok"),bad:t(l,"ledger.bad")}}/>
      <a className="text-sm underline" href={`/verify?q=${e.prev_hash}`}>{t(l,"ledger.prev")}</a>
    </section>}
    {recent.length>0&&<section className={box}>
      <h2 className="font-bold">{t(l,"ledger.recent")}</h2>
      {recent.map(r=><a key={r.seq} href={`/verify?q=${encodeURIComponent(r.match_id)}`} className="block text-xs" dir="ltr">#{r.seq} {r.match_id} · {r.entry_hash.slice(0,16)}…</a>)}
    </section>}
    <section className={box}>
      <h2 className="font-bold">{t(l,"ledger.roots")}</h2>
      <p className="text-sm">{t(l,"ledger.ots")} <a className="underline" href="https://opentimestamps.org" target="_blank" rel="noreferrer">opentimestamps.org</a></p>
      {roots.length===0&&<p className="opacity-70 text-sm">{t(l,"ledger.noroots")}</p>}
      {roots.map(r=><div key={r.day} className="text-xs flex flex-wrap gap-2 items-center" dir="ltr">
        <b>{r.day}</b><span>#{r.last_seq}</span><code className="break-all">{r.root_hash}</code>
        {r.ots_proof?<><a className="underline" href={`/api/verify/ots/${r.day}?txt=1`}>.txt</a><a className="underline" href={`/api/verify/ots/${r.day}`}>.ots</a></>:<span className="opacity-60">{t(l,"ledger.pending")}</span>}
      </div>)}
    </section>
  </main>;
}
