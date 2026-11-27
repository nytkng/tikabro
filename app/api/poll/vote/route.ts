export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {dbRaw} from "@/lib/db";
import {limit,TOO_MANY,clientIp} from "@/lib/ratelimit";
import {sha256} from "@/lib/auth";
import {pollByCode,pollCounts,isOpen} from "@/components/poll/lib";
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
export async function POST(req:Request){
  const ip=clientIp(req);
  if(!await limit(`poll:vote:ip:${ip}`,60,20))return bad(TOO_MANY,429);
  const b:any=await req.json().catch(()=>null);
  const choice=String(b?.choice||"");
  if(!["home","draw","away"].includes(choice))return bad("طلب غير صحيح.");
  const p=await pollByCode(String(b?.code||""));
  if(!p)return bad("التصويت ما كاينش.",404);
  if(!isOpen(p))return bad("التصويت تسكّر.",409);
  const salt=process.env.POLL_SALT||process.env.PLAYER_SECRET||("hadaf-poll:"+(process.env.SUPABASE_SERVICE_KEY||"dev"));
  const voter=await sha256(`${ip}|${req.headers.get("user-agent")||""}|${p.id}|${salt}`);
  const r=await dbRaw("rpc/poll_vote",{method:"POST",body:JSON.stringify({p_poll:p.id,p_voter:voter,p_choice:choice})});
  if(!r.ok)return bad("تعذّر التصويت الآن.",500);
  if(r.json==="closed")return bad("التصويت تسكّر.",409);
  if(r.json==="full")return bad("التصويت تعمّر.",409);
  if(r.json!=="ok")return bad("التصويت ما كاينش.",404);
  return NextResponse.json({ok:true,choice,counts:await pollCounts(p.id)});
}
export async function GET(req:Request){
  const p=await pollByCode(new URL(req.url).searchParams.get("code")||"");
  if(!p)return bad("التصويت ما كاينش.",404);
  return NextResponse.json({ok:true,open:isOpen(p),counts:await pollCounts(p.id)});
}
