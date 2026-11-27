import {db} from "@/lib/db";
export async function GET(){
  const hasEnv=!!process.env.SUPABASE_URL&&!!process.env.SUPABASE_SERVICE_KEY;
  const r=hasEnv?await db<unknown[]>("predictions?select=id&limit=1"):null;
  return Response.json({ok:true,env:hasEnv,db:r!==null?"connected":hasEnv?"failed":"not_configured"},{headers:{"Cache-Control":"no-store"}});
}
