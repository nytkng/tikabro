export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {db,dbRaw} from "@/lib/db";
import {limit,TOO_MANY} from "@/lib/ratelimit";
import {COOKIE,verifyCookie} from "@/lib/auth";
import {checkComment} from "@/lib/moderation";
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
export async function POST(req:Request){
  const pid=await verifyCookie((await cookies()).get(COOKIE)?.value);
  if(!pid)return bad("سجّل الدخول أولا.",401);
  const b:any=await req.json().catch(()=>null);
  const matchId=String(b?.matchId||""),body=String(b?.body||"").trim();
  if(!/^\d{3,12}$/.test(matchId))return bad("طلب غير صحيح.");
  const err=checkComment(body);if(err)return bad(err);
  const p=await db<{created_at:string}[]>(`players?id=eq.${pid}&select=created_at&limit=1`);
  const at=p?.[0]?.created_at;
  if(!at)return bad("تعذّر التحقق من الحساب.",403);
  if(Date.now()-Date.parse(at)<10*60*1000)return bad("الحساب جديد بزاف. استنى 10 دقايق قبل ما تعلّق.",403);
  if(!await limit(`cmt:min:${pid}`,60,5)||!await limit(`cmt:day:${pid}`,86400,30))return bad(TOO_MANY,429);
  const r=await dbRaw("comments",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({match_id:matchId,player_id:pid,body})});
  if(!r.ok)return bad("تعذّر نشر التعليق الآن.",500);
  return NextResponse.json({ok:true});
}
