export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import {currentPlayer} from "@/lib/auth";
import GroupJoin from "@/components/GroupJoin";
export const metadata={title:"دوريات الأصحاب"};
type M={group_id:string;groups:{name:string;code:string;owner:string}|null};
export default async function Groups(){
  const me=await currentPlayer();
  const card="rounded-2xl bg-card border border-line p-5";
  if(!me)return(<section className={card}>
    <h1 className="font-display text-2xl font-bold text-white mb-3">دوريات الأصحاب</h1>
    <p className="text-mute leading-7 mb-4">دير دوري خاص مع صحابك وشوفو شكون يتوقع خير. بلا دراهم، بلا جوائز، غير الفخر.</p>
    <a href="/login" className="btn h-11 rounded-xl bg-white !text-[#0B0D14] font-semibold px-5 inline-flex items-center">سجّل الدخول باش تبدا</a>
  </section>);
  const rows=await db<M[]>(`group_members?player_id=eq.${me.id}&select=group_id,groups(name,code,owner)&order=joined_at.desc`);
  return(<div className="flex flex-col gap-4">
    <section className={card}>
      <h1 className="font-display text-2xl font-bold text-white mb-1">دوريات الأصحاب</h1>
      <p className="text-mute text-sm leading-6 mb-4">ترتيب خاص بيناتكم من نفس التوقعات المختومة. بلا دراهم، بلا جوائز.</p>
      {rows===null?<p className="text-mute">تعذّر الاتصال بقاعدة البيانات الآن.</p>
      :rows.length?<ul>{rows.filter(r=>r.groups).map(r=><li key={r.group_id} className="border-t border-line first:border-0">
        <a href={`/groups/${r.groups!.code}`} className="flex justify-between py-3 hover:text-violet"><span>{r.groups!.name}</span><span className="text-mute text-sm">{r.groups!.owner===me.id?"أنت المسؤول":"عضو"}</span></a></li>)}</ul>
      :<p className="text-mute">مازال ما دخلت حتى دوري. أنشئ واحد ولا ادخل بكود.</p>}
    </section>
    <section className={card}><h2 className="font-display text-lg font-bold text-violet mb-3">أنشئ دوري جديد</h2><GroupJoin mode="create"/></section>
    <section className={card}><h2 className="font-display text-lg font-bold text-amber mb-3">ادخل بكود</h2><GroupJoin mode="join"/></section>
  </div>);
}
