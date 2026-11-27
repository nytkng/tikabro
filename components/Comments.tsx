import {db} from "@/lib/db";
import {currentPlayer} from "@/lib/auth";
import CommentForm,{ReportButton} from "./CommentForm";
type C={id:number;player_id:string;body:string;created_at:string};
function ago(iso:string){
  const s=Math.max(0,(Date.now()-Date.parse(iso))/1000);
  if(s<60)return "دركا";const m=Math.floor(s/60);if(m<60)return `قبل ${m} دقيقة`;
  const h=Math.floor(m/60);if(h<24)return `قبل ${h} ساعة`;const d=Math.floor(h/24);return `قبل ${d} يوم`;
}
export default async function Comments({matchId}:{matchId:string}){
  if(!/^\d{3,12}$/.test(matchId))return null;
  const [me,list]=await Promise.all([currentPlayer(),db<C[]>(`comments?match_id=eq.${matchId}&hidden=eq.false&select=id,player_id,body,created_at&order=created_at.desc&limit=30`)]);
  const rows=list||[];const ids=[...new Set(rows.map(r=>r.player_id))];
  const ps=ids.length?await db<{id:string;nick:string;hue:number|null}[]>(`players?id=in.(${ids.join(",")})&select=id,nick,hue`):[];
  const P=new Map((ps||[]).map(p=>[p.id,p]));
  return(<section className="panel p-5 sm:p-6">
    <h2 className="font-display text-xl text-white mb-1 flex items-center gap-2"><i aria-hidden className="w-1.5 h-5 rounded-full bg-teal"/>النقاش <span className="text-xs font-sans text-mute">({rows.length})</span></h2>
    <p className="text-xs text-mute mb-4 leading-6">احترم الناس. بلا روابط، بلا رهان، بلا سب. 3 بلاغات = يتخبى التعليق.</p>
    {me?<CommentForm matchId={matchId}/>:<a href="/login" className="btn cta inline-flex items-center min-h-[44px] px-6 rounded-xl font-semibold">ادخل باش تشارك في النقاش</a>}
    <ul className="mt-5 flex flex-col gap-3">
      {rows.length===0&&<li className="text-sm text-mute">مازال حتى تعليق. كون الأول.</li>}
      {rows.map(c=>{const p=P.get(c.player_id);const hue=p?.hue??250;return(
        <li key={c.id} className="rounded-xl bg-card border border-line p-3">
          <div className="flex items-center gap-2 text-xs">
            <span aria-hidden className="w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold text-bg" style={{background:`hsl(${hue} 70% 70%)`}}>{(p?.nick||"؟").slice(0,1)}</span>
            <a href={p?`/u/${encodeURIComponent(p.nick)}`:"#"} className="font-semibold text-white hover:underline"><bdi>{p?.nick||"لاعب"}</bdi></a>
            <time dateTime={c.created_at} className="text-mute">{ago(c.created_at)}</time>
            {me&&me.id!==c.player_id&&<span className="ms-auto"><ReportButton id={c.id}/></span>}
          </div>
          <p dir="auto" className="mt-2 text-sm text-ink leading-7 whitespace-pre-wrap break-words">{c.body}</p>
        </li>)})}
    </ul>
  </section>);
}
