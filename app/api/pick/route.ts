export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {dbRaw} from "@/lib/db";
import {COOKIE,verifyCookie} from "@/lib/auth";
const ID=/^(soccer|basketball)-([a-z0-9.]+):(\d{3,12})$/i;
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
export async function POST(req:Request){
  const pid=await verifyCookie((await cookies()).get(COOKIE)?.value);
  if(!pid)return bad("سجّل الدخول أولا.",401);
  const b:any=await req.json().catch(()=>null);
  const m=ID.exec(String(b?.matchId||"")),pick=String(b?.pick||"");
  if(!m||!["home","draw","away"].includes(pick))return bad("طلب غير صحيح.");
  const [,sport,league,eid]=m;
  if(sport==="basketball"&&pick==="draw")return bad("ما كاين تعادل في كرة السلة.");
  // وقت البداية والحالة نأخذهم نحن من المصدر، ما نثقوش في المتصفح
  let kickoff:string,state:string;
  try{
    const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eid}`,{cache:"no-store"});
    if(!r.ok)return bad("تعذّر التحقق من المباراة، حاول بعد قليل.",502);
    const j:any=await r.json();const c=j?.header?.competitions?.[0];
    kickoff=c?.date;state=c?.status?.type?.state;
    if(!kickoff)return bad("مباراة غير معروفة.",404);
  }catch{return bad("تعذّر التحقق من المباراة، حاول بعد قليل.",502)}
  if(state!=="pre"||Date.parse(kickoff)<=Date.now())return bad("المباراة بدأت، التوقعات مقفولة.",409);
  const r=await dbRaw("rpc/make_pick",{method:"POST",body:JSON.stringify({p_player:pid,p_match:eid,p_league:league,p_kickoff:kickoff,p_pick:pick})});
  if(!r.ok)return bad(r.json?.message?String(r.json.message).slice(0,120):"تعذّر ختم التوقع الآن.",r.status||500);
  return NextResponse.json({ok:true,pick});
}
