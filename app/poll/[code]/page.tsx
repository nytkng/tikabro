export const dynamic="force-dynamic";
import {matchFromDB} from "@/lib/feed";
import {getLang} from "@/lib/lang";
import {t} from "@/lib/i18n";
import {pollByCode,pollCounts,isOpen} from "@/components/poll/lib";
import PollVote from "@/components/poll/PollVote";
export const metadata={title:"التصويت السريع"};
export default async function PollPage({params}:{params:Promise<{code:string}>}){
  const code=(await params).code;const l=await getLang();
  const p=await pollByCode(code);
  const m=p?await matchFromDB(p.match_id).catch(()=>null):null;
  if(!p||!m)return <p className="text-mute p-10 text-center text-xl">{t(l,"poll.missing")}</p>;
  const c=await pollCounts(p.id);
  return(<div className="max-w-xl mx-auto flex flex-col gap-4 py-4">
   <h1 className="font-display text-3xl text-white text-center">{t(l,"poll.title")} <bdi dir="ltr" className="text-amber">#{p.code}</bdi></h1>
   <PollVote code={p.code} open={isOpen(p)} initial={c} draw={m.sport==="football"} home={m.home} away={m.away} homeLogo={m.homeLogo??null} awayLogo={m.awayLogo??null}
    L={{ask:t(l,"poll.ask"),draw:t(l,"poll.draw"),votes:t(l,"poll.votes",{n:"{n}"}),voted:t(l,"poll.voted"),closed:t(l,"poll.closed"),cta:t(l,"poll.cta"),error:t(l,"poll.error")}}/>
  </div>);
}
