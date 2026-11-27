// تسجيل الهاتف ومتابعة مباراة (ولا إلغاؤها).
import {NextResponse} from "next/server";
import {dbRaw} from "@/lib/db";
import {langOf} from "@/lib/apiLang";
export async function POST(req:Request){
  const j=await req.json().catch(()=>null);const s=j?.sub,m=String(j?.match||"").slice(0,120);
  const ep=String(s?.endpoint||"");
  if(!/^https:\/\//.test(ep)||ep.length>900||!m)return NextResponse.json({error:"bad"},{status:400});
  const H={Prefer:"resolution=merge-duplicates,return=minimal"};
  const a=await dbRaw("push_subs",{method:"POST",headers:H,body:JSON.stringify({endpoint:ep,p256dh:String(s?.keys?.p256dh||"").slice(0,200),auth:String(s?.keys?.auth||"").slice(0,100),lang:langOf(req)})});
  if(!a.ok)return NextResponse.json({error:"db"},{status:502});
  if(j?.off){await dbRaw(`push_follows?endpoint=eq.${encodeURIComponent(ep)}&match_id=eq.${encodeURIComponent(m)}`,{method:"DELETE"});return NextResponse.json({ok:true,on:false})}
  const b=await dbRaw("push_follows",{method:"POST",headers:H,body:JSON.stringify({endpoint:ep,match_id:m,url:("/match/"+encodeURIComponent(String(j?.key||""))).slice(0,300)})});
  return NextResponse.json({ok:b.ok,on:true},{status:b.ok?200:502});
}
