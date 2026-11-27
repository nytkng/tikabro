export const dynamic = "force-dynamic";
import {db} from "@/lib/db";
export const revalidate=120;
export const metadata={title:"الترتيب"};
type Row={nick:string;n:number;hits:number;points:number};
type Ai={n:number;hits:number;points:number};
export default async function Leaders({searchParams}:{searchParams:Promise<{r?:string}>}){
  const {r}=await searchParams;const all=r==="all";
  const since=all?"2020-01-01T00:00:00Z":new Date(Date.now()-7*864e5).toISOString();
  const post=(b:object)=>({method:"POST",body:JSON.stringify(b)});
  const [rows,ai]=await Promise.all([
    db<Row[]>("rpc/leaderboard",post({p_since:since,p_min:1,p_days:1,p_age:"0 seconds"})),
    db<Ai[]>("rpc/ai_points",post({p_since:since})),
  ]);
  const a=ai?.[0];
  const list:(Row&{ai?:boolean})[]=[...(rows||[])];
  if(a&&a.n>0)list.push({nick:"الـ AI (هدف)",n:a.n,hits:a.hits,points:a.points,ai:true});
  list.sort((x,y)=>y.points-x.points);
  return(<section className="rounded-[20px] bg-surface border border-line p-7">
   <h1 className="text-2xl font-bold text-white mb-4">الترتيب</h1>
   <div className="flex gap-2 mb-5 text-sm"><a href="/leaders" className={`px-4 py-2.5 rounded-full ${!all?"bg-violet text-bg font-semibold":"border border-line text-mute"}`}>هذا الأسبوع</a><a href="/leaders?r=all" className={`px-4 py-2.5 rounded-full ${all?"bg-violet text-bg font-semibold":"border border-line text-mute"}`}>كل الوقت</a></div>
   {rows===null?<p className="text-mute leading-7">تعذّر الاتصال بقاعدة البيانات الآن.</p>
   :list.length?<ol>{list.map((x,i)=><li key={x.nick} className={`flex justify-between gap-3 py-3 border-t border-line first:border-0 ${x.ai?"text-amber":""}`}><span>{i+1}. {x.nick}</span><span className="text-mute">{x.hits} من {x.n} · {x.points} نقطة</span></li>)}</ol>
   :<p className="text-mute leading-7">ما كاين حتى توقع مُسوّى في هذه الفترة. بمجرد ما تنتهي المباريات المختومة، يظهر المتوقعون هنا مع الـ AI.</p>}
  </section>);
}
