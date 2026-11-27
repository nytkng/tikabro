export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {t} from "@/lib/i18n";
import {langOf} from "@/lib/apiLang";
import {cookies} from "next/headers";
import {dbRaw} from "@/lib/db";
import {limit,TOO_MANY} from "@/lib/ratelimit";
import {COOKIE,verifyCookie} from "@/lib/auth";
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
export async function POST(req:Request){const L=langOf(req);
  const pid=await verifyCookie((await cookies()).get(COOKIE)?.value);
  if(!pid)return bad(t(L,"api.login"),401);
  if(!await limit(`poll:create:${pid}`,3600,10))return bad(TOO_MANY,429);
  const b:any=await req.json().catch(()=>null);
  const eid=String(b?.matchId||"").split(":").pop()||"";
  if(!/^\d{3,12}$/.test(eid))return bad(t(L,"api.bad_req"));
  const m=await dbRaw(`matches?eid=eq.${eid}&select=kickoff,state&limit=1`);
  const row=m.ok?m.json?.[0]:null;if(!row)return bad(t(L,"api.unknown_match"),404);
  const max=Date.now()+90*60e3,ko=Date.parse(row.kickoff);
  const closes=row.state==="pre"&&ko>Date.now()?Math.min(ko,max):max;
  for(let i=0;i<8;i++){
    const code=String(1000+(crypto.getRandomValues(new Uint32Array(1))[0]%9000));
    const r=await dbRaw("polls",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({code,match_id:eid,created_by:pid,closes_at:new Date(closes).toISOString()})});
    if(r.ok)return NextResponse.json({ok:true,code,closesAt:new Date(closes).toISOString()});
    if(r.status!==409)return bad(t(L,"api.poll_create_fail"),500);
    // كود مستعمل: نحرّر الأكواد القديمة المغلقة ثم نعاود
    await dbRaw(`polls?code=eq.${code}&closes_at=lt.${encodeURIComponent(new Date(Date.now()-864e5).toISOString())}`,{method:"DELETE"});
  }
  return bad(t(L,"api.retry"),503);
}
