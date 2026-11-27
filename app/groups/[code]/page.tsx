export const dynamic="force-dynamic";
import {headers} from "next/headers";
import {db} from "@/lib/db";
import {currentPlayer} from "@/lib/auth";
import GroupJoin from "@/components/GroupJoin";
export const metadata={title:"دوري الأصحاب"};
type G={id:string;name:string;code:string;owner:string};
type Row={nick:string;n:number;hits:number;points:number};
export default async function Group({params,searchParams}:{params:Promise<{code:string}>;searchParams:Promise<{r?:string}>}){
  const [{code:raw},{r}]=await Promise.all([params,searchParams]);
  const code=String(raw).toUpperCase().replace(/[^A-Z0-9]/g,"");const all=r==="all";
  const card="rounded-2xl bg-card border border-line p-5";
  const g=/^[A-Z0-9]{8}$/.test(code)?(await db<G[]>(`groups?code=eq.${code}&select=id,name,code,owner&limit=1`))?.[0]:undefined;
  if(!g)return(<section className={card}><h1 className="font-display text-xl font-bold text-white mb-2">ما لقيناش هذا الدوري</h1><p className="text-mute mb-3">تأكد من الكود ولا الرابط.</p><a href="/groups" className="text-violet">← دوريات الأصحاب</a></section>);
  const since=all?"2020-01-01T00:00:00Z":new Date(Date.now()-7*864e5).toISOString();
  const [me,members,rows,h]=await Promise.all([
    currentPlayer(),
    db<{player_id:string}[]>(`group_members?group_id=eq.${g.id}&select=player_id`),
    db<Row[]>("rpc/group_board",{method:"POST",body:JSON.stringify({p_group:g.id,p_since:since})}),
    headers(),
  ]);
  const count=members?.length??0;const isMember=!!me&&!!members?.some(m=>m.player_id===me.id);
  const host=h.get("x-forwarded-host")||h.get("host")||"localhost";
  const link=`https://${host}/groups/${g.code}`;
  const wa=`https://wa.me/?text=${encodeURIComponent(`أرواح تدخل لدوري "${g.name}" في هدف وشوف شكون يتوقع خير\nالكود: ${g.code}\n${link}`)}`;
  const tab=(on:boolean)=>`px-4 py-2.5 rounded-full ${on?"bg-violet text-bg font-semibold":"border border-line text-mute"}`;
  return(<div className="flex flex-col gap-4">
    <section className={card}>
      <a href="/groups" className="text-mute text-sm hover:text-violet">← دوريات الأصحاب</a>
      <h1 className="font-display text-2xl font-bold text-white mt-2">{g.name}</h1>
      <p className="text-mute text-sm mt-1">{count} عضو من 50 · بلا دراهم، بلا جوائز</p>
      {!isMember&&<div className="mt-4">{me?(count>=50?<p className="text-amber">الدوري عامر.</p>:<GroupJoin mode="joinCode" code={g.code}/>):<a href="/login" className="btn h-11 rounded-xl bg-white !text-[#0B0D14] font-semibold px-5 inline-flex items-center">سجّل الدخول باش تدخل</a>}</div>}
    </section>
    <section className={card}>
      <div className="flex gap-2 mb-4 text-sm"><a href={`/groups/${g.code}`} className={tab(!all)}>هذا الأسبوع</a><a href={`/groups/${g.code}?r=all`} className={tab(all)}>كل الوقت</a></div>
      {rows===null?<p className="text-mute">تعذّر تحميل الترتيب الآن.</p>
      :rows.length?<ol>{rows.map((x,i)=><li key={x.nick} className={`flex justify-between gap-3 py-3 border-t border-line first:border-0 ${me?.nick===x.nick?"text-violet":""}`}><span>{i+1}. <a href={`/u/${encodeURIComponent(x.nick)}`} className="hover:text-violet">{x.nick}</a></span><span className="text-mute">{x.hits} من {x.n} · {Number(x.points)} نقطة</span></li>)}</ol>
      :<p className="text-mute leading-7">مازال ما كاين حتى توقع مُسوّى لأعضاء هذا الدوري في هذه الفترة.</p>}
    </section>
    <section className={card}>
      <h2 className="font-display text-lg font-bold text-pink mb-3">عرّض صحابك</h2>
      <p className="text-mute text-sm mb-2">الكود: <span dir="ltr" className="text-white font-mono tracking-widest">{g.code}</span></p>
      <input readOnly value={link} dir="ltr" className="w-full h-11 rounded-xl bg-bg border border-line px-3 text-white mb-3"/>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn h-11 rounded-xl bg-white !text-[#0B0D14] font-semibold px-5 inline-flex items-center">ابعث في واتساب</a>
    </section>
    {isMember&&<GroupJoin mode="leave" code={g.code}/>}
  </div>);
}
