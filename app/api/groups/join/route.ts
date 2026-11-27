export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {dbRaw} from "@/lib/db";
import {currentPlayer} from "@/lib/auth";
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
export async function POST(req:Request){
  const me=await currentPlayer();if(!me)return bad("سجّل الدخول أولا.",401);
  const b:any=await req.json().catch(()=>null);
  const code=String(b?.code??"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(code))return bad("الكود لازم يكون 8 حروف/أرقام.");
  const g=await dbRaw(`groups?code=eq.${code}&select=id,code&limit=1`);
  if(!g.ok)return bad("تعذّر الاتصال بقاعدة البيانات.",502);
  const grp=g.json?.[0];if(!grp)return bad("ما لقيناش دوري بهذا الكود.",404);
  const mine=await dbRaw(`group_members?group_id=eq.${grp.id}&player_id=eq.${me.id}&select=player_id`);
  if(mine.json?.length)return NextResponse.json({ok:true,code,already:true});
  const cnt=await dbRaw(`group_members?group_id=eq.${grp.id}&select=player_id`);
  if((cnt.json?.length??0)>=50)return bad("الدوري عامر: 50 عضو كحد أقصى.",409);
  const r=await dbRaw("group_members",{method:"POST",body:JSON.stringify({group_id:grp.id,player_id:me.id})});
  if(!r.ok&&r.status!==409)return bad("تعذّر الانضمام الآن.",r.status||500);
  return NextResponse.json({ok:true,code});
}
