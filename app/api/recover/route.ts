export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {dbRaw} from "@/lib/db";
import {limit,ipKey,TOO_MANY} from "@/lib/ratelimit";
import {COOKIE,cookieOpts,cookieValue,sha256} from "@/lib/auth";
export async function POST(req:Request){
  const b:any=await req.json().catch(()=>null);
  const nick=String(b?.nick||"").trim(),code=String(b?.code||"").trim().toUpperCase();
  if(!nick||!code)return NextResponse.json({error:"bad"},{status:400});
  if(!await limit(ipKey("recover",req),3600,5)||!await limit(`recover:nick:${nick.toLowerCase()}`,3600,10))
    return NextResponse.json({error:"rate",msg:TOO_MANY},{status:429});
  const r=await dbRaw(`players?nick=eq.${encodeURIComponent(nick)}&select=id,recovery_hash&limit=1`);
  const p=r.json?.[0];
  if(!p||!p.recovery_hash||p.recovery_hash!==await sha256(code))
    return NextResponse.json({error:"no",msg:"الاسم أو الكود غير صحيح."},{status:401});
  const res=NextResponse.json({ok:true});
  res.cookies.set(COOKIE,await cookieValue(p.id),cookieOpts);
  return res;
}
