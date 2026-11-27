export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {t} from "@/lib/i18n";
import {langOf} from "@/lib/apiLang";
import {cookies} from "next/headers";
import {dbRaw} from "@/lib/db";
import {limit,TOO_MANY} from "@/lib/ratelimit";
import {COOKIE,verifyCookie} from "@/lib/auth";
const ID=/^(rugby-league|australian-football|field-hockey|lacrosse|soccer|basketball|hockey|football|baseball|rugby|volleyball)-([a-z0-9._-]+):(\d{3,12})$/i;
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
export async function POST(req:Request){const L=langOf(req);
  const pid=await verifyCookie((await cookies()).get(COOKIE)?.value);
  if(!pid)return bad(t(L,"api.login"),401);
  if(!await limit(`pick:player:${pid}`,60,60))return bad(TOO_MANY,429);
  const b:any=await req.json().catch(()=>null);
  const m=ID.exec(String(b?.matchId||"")),pick=String(b?.pick||"");
  if(!m||!["home","draw","away"].includes(pick))return bad(t(L,"api.bad_req"));
  const [,sport,league,eid]=m;
  if(!["soccer","rugby","rugby-league","australian-football"].includes(sport)&&pick==="draw")return bad(t(L,"api.no_draw"));
  // وقت البداية والحالة نأخذهم نحن من المصدر، ما نثقوش في المتصفح
  let kickoff:string|undefined,state:string|undefined;
  const loc=await dbRaw(`matches?eid=eq.${eid}&select=kickoff,state&limit=1`);
  const row=loc.ok?loc.json?.[0]:null;
  if(row?.kickoff){kickoff=row.kickoff;state=row.state}
  else try{
    const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eid}`,{cache:"no-store"});
    if(!r.ok)return bad(t(L,"api.match_check"),502);
    const j:any=await r.json();const c=j?.header?.competitions?.[0];
    kickoff=c?.date;state=c?.status?.type?.state;
    if(!kickoff)return bad(t(L,"api.unknown_match"),404);
  }catch{return bad(t(L,"api.match_check"),502)}
  if(!kickoff)return bad(t(L,"api.unknown_match"),404);
  if(state!=="pre"||Date.parse(kickoff)<=Date.now())return bad(t(L,"api.started"),409);
  const r=await dbRaw("rpc/make_pick",{method:"POST",body:JSON.stringify({p_player:pid,p_match:eid,p_league:league,p_kickoff:kickoff,p_pick:pick})});
  if(!r.ok)return bad(r.json?.message?String(r.json.message).slice(0,120):t(L,"api.seal_fail"),r.status||500);
  return NextResponse.json({ok:true,pick});
}
