export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {t} from "@/lib/i18n";
import {langOf} from "@/lib/apiLang";
import {dbRaw} from "@/lib/db";
import {currentPlayer} from "@/lib/auth";
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode=()=>[...crypto.getRandomValues(new Uint8Array(8))].map(x=>A[x%A.length]).join("");
export async function POST(req:Request){const L=langOf(req);
  const me=await currentPlayer();if(!me)return bad(t(L,"api.login"),401);
  const b:any=await req.json().catch(()=>null);
  const name=String(b?.name??"").replace(/\s+/g," ").trim();
  if(name.length<2||name.length>40)return bad(t(L,"api.gname"));
  if(/[<>]/.test(name))return bad(t(L,"api.gname_chars"));
  const own=await dbRaw(`groups?owner=eq.${me.id}&select=id`,{headers:{Prefer:"count=exact"}});
  if(!own.ok)return bad(t(L,"api.db"),502);
  if((own.json?.length??0)>=10)return bad(t(L,"api.glimit"),409);
  for(let i=0;i<5;i++){
    const code=genCode();
    const r=await dbRaw("groups?select=id,code",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({name,code,owner:me.id})});
    if(r.status===409)continue; // تكرار الكود نادر، نعاودو
    if(!r.ok||!r.json?.[0])return bad(t(L,"api.gcreate_fail"),r.status||500);
    const g=r.json[0];
    const m=await dbRaw("group_members",{method:"POST",body:JSON.stringify({group_id:g.id,player_id:me.id})});
    if(!m.ok){await dbRaw(`groups?id=eq.${g.id}`,{method:"DELETE"});return bad(t(L,"api.gcreate_fail"),500)}
    return NextResponse.json({ok:true,code:g.code});
  }
  return bad(t(L,"api.gcode_fail"),500);
}
