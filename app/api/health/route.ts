export const dynamic = "force-dynamic";
import {dbRaw} from "@/lib/db";
// فحص بسيط: ما يكشف حتى معلومة على المفاتيح
export async function GET(){
  const p=await dbRaw("predictions?select=match_id&limit=1");
  const m=await dbRaw("matches?select=eid&limit=1");
  return Response.json({ok:true,db:p.ok?"connected":"failed",feed:m.ok?"ok":`status ${m.status} ${String(m.json?.code||"")}`.trim()},{headers:{"Cache-Control":"no-store"}});
}
