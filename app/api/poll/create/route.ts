export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {dbRaw} from "@/lib/db";
import {limit,TOO_MANY} from "@/lib/ratelimit";
import {COOKIE,verifyCookie} from "@/lib/auth";
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
export async function POST(req:Request){
  const pid=await verifyCookie((await cookies()).get(COOKIE)?.value);
  if(!pid)return bad("سجّل الدخول أولا.",401);
  if(!await limit(`poll:create:${pid}`,3600,10))return bad(TOO_MANY,429);
  const b:any=await req.json().catch(()=>null);
  const eid=String(b?.matchId||"").split(":").pop()||"";
  if(!/^\d{3,12}$/.test(eid))return bad("طلب غير صحيح.");
  const m=await dbRaw(`matches?eid=eq.${eid}&select=kickoff,state&limit=1`);
  const row=m.ok?m.json?.[0]:null;if(!row)return bad("مباراة غير معروفة.",404);
  const max=Date.now()+90*60e3,ko=Date.parse(row.kickoff);
  const closes=row.state==="pre"&&ko>Date.now()?Math.min(ko,max):max;
  for(let i=0;i<8;i++){
    const code=String(1000+(crypto.getRandomValues(new Uint32Array(1))[0]%9000));
    const r=await dbRaw("polls",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({code,match_id:eid,created_by:pid,closes_at:new Date(closes).toISOString()})});
    if(r.ok)return NextResponse.json({ok:true,code,closesAt:new Date(closes).toISOString()});
    if(r.status!==409)return bad("تعذّر إنشاء التصويت.",500);
    // كود مستعمل: نحرّر الأكواد القديمة المغلقة ثم نعاود
    await dbRaw(`polls?code=eq.${code}&closes_at=lt.${encodeURIComponent(new Date(Date.now()-864e5).toISOString())}`,{method:"DELETE"});
  }
  return bad("حاول مرة أخرى.",503);
}
