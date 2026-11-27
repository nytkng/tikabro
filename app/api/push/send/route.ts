// كل دقيقة (pg_cron): نبعثو دقة لكل هاتف عندو رسائل جديدة. محمي بـ CRON_SECRET.
import {NextResponse} from "next/server";
import {db,dbRaw} from "@/lib/db";
import {ping} from "@/lib/push";
const same=(a:string,b:string)=>{if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0};
export async function GET(req:Request){
  const secret=process.env.CRON_SECRET?.trim();if(!secret)return NextResponse.json({error:"CRON_SECRET not set"},{status:503});
  const got=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!same(got,secret))return NextResponse.json({error:"unauthorized"},{status:401});
  if(!process.env.VAPID_PRIVATE)return NextResponse.json({error:"VAPID_PRIVATE not set"},{status:503});
  const rows=(await db<{id:number;endpoint:string}[]>("push_queue?sent_at=is.null&delivered_at=is.null&select=id,endpoint&order=id.asc&limit=300"))||[];
  const eps=[...new Set(rows.map(r=>r.endpoint))].slice(0,40);let ok=0,gone=0;
  for(const ep of eps){const st=await ping(ep);if(st>=200&&st<300)ok++;else if(st===404||st===410){gone++;await dbRaw(`push_subs?endpoint=eq.${encodeURIComponent(ep)}`,{method:"DELETE"})}}
  const ids=rows.filter(r=>eps.includes(r.endpoint)).map(r=>r.id);
  if(ids.length)await dbRaw(`push_queue?id=in.(${ids.join(",")})`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({sent_at:new Date().toISOString()})});
  return NextResponse.json({sent:ok,gone,endpoints:eps.length});
}
