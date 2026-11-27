export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {t} from "@/lib/i18n";
import {langOf} from "@/lib/apiLang";
import {dbRaw} from "@/lib/db";
import {currentPlayer} from "@/lib/auth";
const bad=(msg:string,status=400)=>NextResponse.json({error:true,msg},{status});
export async function POST(req:Request){const L=langOf(req);
  const me=await currentPlayer();if(!me)return bad(t(L,"api.login"),401);
  const b:any=await req.json().catch(()=>null);
  const code=String(b?.code??"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(code))return bad(t(L,"api.bad_code"));
  const g=await dbRaw(`groups?code=eq.${code}&select=id,owner&limit=1`);
  const grp=g.json?.[0];if(!grp)return bad(t(L,"api.gnf"),404);
  if(grp.owner===me.id){
    // صاحب الدوري: يخرج إذا ما بقى حتى واحد، وإلا ينقل الملكية للأقدم
    const ms=await dbRaw(`group_members?group_id=eq.${grp.id}&player_id=neq.${me.id}&select=player_id&order=joined_at.asc&limit=1`);
    const next=ms.json?.[0]?.player_id;
    if(!next){const d=await dbRaw(`groups?id=eq.${grp.id}`,{method:"DELETE"});return d.ok?NextResponse.json({ok:true,deleted:true}):bad(t(L,"api.leave_fail"),500)}
    const u=await dbRaw(`groups?id=eq.${grp.id}`,{method:"PATCH",body:JSON.stringify({owner:next})});
    if(!u.ok)return bad(t(L,"api.leave_fail"),500);
  }
  const r=await dbRaw(`group_members?group_id=eq.${grp.id}&player_id=eq.${me.id}`,{method:"DELETE"});
  if(!r.ok)return bad(t(L,"api.leave_fail"),500);
  return NextResponse.json({ok:true});
}
