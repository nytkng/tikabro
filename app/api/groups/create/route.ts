export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {dbRaw} from "@/lib/db";
import {currentPlayer} from "@/lib/auth";
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode=()=>[...crypto.getRandomValues(new Uint8Array(8))].map(x=>A[x%A.length]).join("");
export async function POST(req:Request){
  const me=await currentPlayer();if(!me)return bad("سجّل الدخول أولا.",401);
  const b:any=await req.json().catch(()=>null);
  const name=String(b?.name??"").replace(/\s+/g," ").trim();
  if(name.length<2||name.length>40)return bad("اسم الدوري لازم يكون بين 2 و40 حرف.");
  if(/[<>]/.test(name))return bad("الاسم فيه رموز ما تنفعش.");
  const own=await dbRaw(`groups?owner=eq.${me.id}&select=id`,{headers:{Prefer:"count=exact"}});
  if(!own.ok)return bad("تعذّر الاتصال بقاعدة البيانات.",502);
  if((own.json?.length??0)>=10)return bad("وصلت للحد: 10 دوريات لكل لاعب.",409);
  for(let i=0;i<5;i++){
    const code=genCode();
    const r=await dbRaw("groups?select=id,code",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({name,code,owner:me.id})});
    if(r.status===409)continue; // تكرار الكود نادر، نعاودو
    if(!r.ok||!r.json?.[0])return bad("تعذّر إنشاء الدوري الآن.",r.status||500);
    const g=r.json[0];
    const m=await dbRaw("group_members",{method:"POST",body:JSON.stringify({group_id:g.id,player_id:me.id})});
    if(!m.ok){await dbRaw(`groups?id=eq.${g.id}`,{method:"DELETE"});return bad("تعذّر إنشاء الدوري الآن.",500)}
    return NextResponse.json({ok:true,code:g.code});
  }
  return bad("تعذّر توليد كود، عاود.",500);
}
