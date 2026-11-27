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
  const b:any=await req.json().catch(()=>null);
  const id=Number(b?.id);
  if(!Number.isSafeInteger(id)||id<1)return bad("طلب غير صحيح.");
  if(!await limit(`cmtrep:${pid}`,3600,20))return bad(TOO_MANY,429);
  const r=await dbRaw("rpc/report_comment",{method:"POST",body:JSON.stringify({p_comment:id,p_player:pid})});
  if(!r.ok)return bad("تعذّر إرسال البلاغ.",500);
  return NextResponse.json({ok:true});
}
