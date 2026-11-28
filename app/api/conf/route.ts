// نسبة الثقة في الاختيار (55..95). تتختم مع الاختيار وما تتبدّلش بعد البداية.
export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {dbRaw} from "@/lib/db";
import {limit,TOO_MANY} from "@/lib/ratelimit";
import {COOKIE,verifyCookie} from "@/lib/auth";
import {t} from "@/lib/i18n";
import {langOf} from "@/lib/apiLang";
const ID=/:(\d{3,12})$/;
export async function POST(req:Request){const L=langOf(req);
  const pid=await verifyCookie((await cookies()).get(COOKIE)?.value);
  if(!pid)return NextResponse.json({error:true,msg:t(L,"api.login")},{status:401});
  if(!await limit(`conf:${pid}`,60,60))return NextResponse.json({error:true,msg:TOO_MANY},{status:429});
  const b:any=await req.json().catch(()=>null);const m=ID.exec(String(b?.matchId||""));const c=Math.round(Number(b?.conf));
  if(!m||!(c>=50&&c<=99))return NextResponse.json({error:true,msg:t(L,"api.bad_req")},{status:400});
  const r=await dbRaw("rpc/set_conf",{method:"POST",body:JSON.stringify({p_player:String(pid),p_match:m[1],p_conf:c})});
  if(!r.ok){const s=String(r.json?.message||"");return NextResponse.json({error:true,msg:s.includes("started")?t(L,"api.started"):s.includes("pick first")?t(L,"cf.pick_first"):t(L,"err")},{status:r.status===400?409:502})}
  return NextResponse.json({ok:true,conf:c});
}
