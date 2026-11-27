export const dynamic = "force-dynamic";
import {dbRaw} from "@/lib/db";
// مؤقت: يعرض شكل نتائج الدوال لحساب تجريبي فقط. يُحذف بعد الاستعمال.
export async function GET(){
  const rpc=async(f:string,body:any)=>{const r=await dbRaw(`rpc/${f}`,{method:"POST",body:JSON.stringify(body)});return {status:r.status,json:r.json};};
  const pl=await dbRaw("players?nick=eq.tikabro_test&select=id&limit=1");
  const id=pl.json?.[0]?.id;
  const cut=(x:any)=>JSON.stringify(x).slice(0,900);
  return Response.json({
    profile_by_nick:cut(await rpc("profile_by_nick",{p_nick:"tikabro_test"})),
    player_stats:cut(id?await rpc("player_stats",{p_player:id}):null),
    profile_calls:cut(id?await rpc("profile_calls",{p_player:id,p_limit:5}):null),
    leaderboard:cut(await rpc("leaderboard",{p_since:"2020-01-01",p_min:1,p_days:1,p_age:"0 seconds"})),
  });
}
