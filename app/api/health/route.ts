export const dynamic = "force-dynamic";
import {db} from "@/lib/db";
// فحص بسيط: ما يكشف حتى معلومة على المفاتيح ولا نص الأخطاء
export async function GET(){
  const r=await db<unknown[]>("predictions?select=match_id&limit=1");
  return Response.json({ok:true,db:r?"connected":"failed"},{headers:{"Cache-Control":"no-store"}});
}
