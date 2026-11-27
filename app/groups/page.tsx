export const dynamic="force-dynamic";
import {db} from "@/lib/db";
import {currentPlayer} from "@/lib/auth";
import GroupJoin from "@/components/GroupJoin";
import {getLang} from "@/lib/lang";
import {t} from "@/lib/i18n";
export async function generateMetadata(){return {title:t(await getLang(),"gr.title")}}
type M={group_id:string;groups:{name:string;code:string;owner:string}|null};
export default async function Groups(){
  const [me,lang]=await Promise.all([currentPlayer(),getLang()]);
  const card="rounded-2xl bg-card border border-line p-5";
  if(!me)return(<section className={card}>
    <h1 className="font-display text-2xl font-bold text-white mb-3">{t(lang,"gr.title")}</h1>
    <p className="text-mute leading-7 mb-4">{t(lang,"gr.pitch")}</p>
    <a href="/login" className="btn h-11 rounded-xl bg-white !text-[#0B0D14] font-semibold px-5 inline-flex items-center">{t(lang,"gr.login_start")}</a>
  </section>);
  const rows=await db<M[]>(`group_members?player_id=eq.${me.id}&select=group_id,groups(name,code,owner)&order=joined_at.desc`);
  return(<div className="flex flex-col gap-4">
    <section className={card}>
      <h1 className="font-display text-2xl font-bold text-white mb-1">{t(lang,"gr.title")}</h1>
      <p className="text-mute text-sm leading-6 mb-4">{t(lang,"gr.sub")}</p>
      {rows===null?<p className="text-mute">{t(lang,"gr.db_err")}</p>
      :rows.length?<ul>{rows.filter(r=>r.groups).map(r=><li key={r.group_id} className="border-t border-line first:border-0">
        <a href={`/groups/${r.groups!.code}`} className="flex justify-between py-3 hover:text-violet"><span>{r.groups!.name}</span><span className="text-mute text-sm">{t(lang,r.groups!.owner===me.id?"gr.owner":"gr.member")}</span></a></li>)}</ul>
      :<p className="text-mute">{t(lang,"gr.none")}</p>}
    </section>
    <section className={card}><h2 className="font-display text-lg font-bold text-violet mb-3">{t(lang,"gr.create_h")}</h2><GroupJoin mode="create" lang={lang}/></section>
    <section className={card}><h2 className="font-display text-lg font-bold text-amber mb-3">{t(lang,"gr.join_h")}</h2><GroupJoin mode="join" lang={lang}/></section>
  </div>);
}
