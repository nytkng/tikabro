export const dynamic = "force-dynamic";
import {supaOrigin} from "@/lib/supa";
// مؤقت: يعرض أسماء الدوال والجداول فقط (بلا أي مفتاح). يُحذف بعد الاستعمال.
export async function GET(){
  const url=supaOrigin(process.env.SUPABASE_URL),key=process.env.SUPABASE_SERVICE_KEY?.trim();
  if(!url||!key)return Response.json({error:"not_configured"});
  const r=await fetch(`${url}/rest/v1/`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});
  const j:any=await r.json().catch(()=>null);
  if(!j?.paths)return Response.json({status:r.status});
  const rpc:Record<string,string[]>={},tables:string[]=[];
  for(const [p,v] of Object.entries<any>(j.paths)){
    if(p.startsWith("/rpc/")){
      const params=v?.post?.parameters?.[0]?.schema?.properties;
      rpc[p.slice(5)]=params?Object.keys(params):[];
    }else if(p!=="/")tables.push(p.slice(1));
  }
  return Response.json({rpc,tables});
}
