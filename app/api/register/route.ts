export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {t} from "@/lib/i18n";
import {langOf} from "@/lib/apiLang";
import {dbRaw} from "@/lib/db";
import {cookies} from "next/headers";
import {COOKIE,cookieOpts,cookieValue,newCode,nickOk,sha256,turnstileOk,unsignVal} from "@/lib/auth";
import {limit,ipKey,TOO_MANY} from "@/lib/ratelimit";
import {GP} from "@/lib/google";
export async function POST(req:Request){const L=langOf(req);
  if(!await limit(ipKey("register",req),3600,5))return NextResponse.json({error:"rate",msg:TOO_MANY},{status:429});
  const b:any=await req.json().catch(()=>null);
  if(!b)return NextResponse.json({error:"bad"},{status:400});
  if(b.website)return NextResponse.json({error:"bad"},{status:400}); // فخ للبوتات
  const nick=String(b.nick||"").trim();
  if(!nickOk(nick))return NextResponse.json({error:"nick",msg:t(L,"api.nick")},{status:400});
  if(!b.adult)return NextResponse.json({error:"adult",msg:t(L,"api.adult")},{status:400});
  // TODO(owner): اضبط TURNSTILE_SECRET في الإنتاج. حاليا إذا ناقص (حتى مع NODE_ENV=production) التسجيل يبقى مسموح باش ما نكسروش التسجيلات.
  if(!await turnstileOk(b.token,req.headers.get("CF-Connecting-IP")||undefined))
    return NextResponse.json({error:"captcha",msg:t(L,"api.captcha")},{status:400});
  const gh=b.google?await unsignVal((await cookies()).get(GP)?.value):null;
  if(b.google&&!gh)return NextResponse.json({error:"google",msg:t(L,"api.google")},{status:400});
  const code=newCode();
  const r=await dbRaw("players",{method:"POST",headers:{Prefer:"return=representation"},
    body:JSON.stringify({nick,recovery_hash:await sha256(code),hue:Math.floor(Math.random()*360),trust:0,...(gh?{google_hash:gh}:{})})});
  if(r.status===409||r.json?.code==="23505")return NextResponse.json({error:"taken",msg:t(L,"api.taken")},{status:409});
  const id=r.json?.[0]?.id;
  if(!r.ok||!id)return NextResponse.json({error:"server",msg:t(L,"api.register_fail")},{status:500});
  const res=NextResponse.json({ok:true,nick,code,google:!!gh});
  if(gh)res.cookies.delete(GP);
  res.cookies.set(COOKIE,await cookieValue(id),cookieOpts);
  return res;
}
