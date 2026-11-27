import {db} from "@/lib/db";
export const revalidate=120;
export default async function Leaders(){
  const rows=await db<{nick:string;hits:number;total:number}[]>("leaderboard?select=*&limit=20");
  return(<section className="rounded-[20px] bg-surface border border-line p-7"><h1 className="text-2xl font-bold text-white mb-4">الترتيب</h1>
   {rows&&rows.length?<ol>{rows.map((r,i)=><li key={i} className="flex justify-between py-3 border-t border-line first:border-0"><span>{i+1}. {r.nick}</span><span className="text-mute">{r.hits} من {r.total}</span></li>)}</ol>
   :<p className="text-mute leading-7">الترتيب فارغ الآن، أو قاعدة البيانات غير موصولة بعد. بمجرد ما يختم المتوقعون توقعاتهم، يظهرون هنا مع الـ AI.</p>}</section>);
}
