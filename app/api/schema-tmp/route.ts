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
  const cols:Record<string,string[]>={};
  for(const t of ["players","picks","seals","predictions","follows"]){
    const pr=j.definitions?.[t]?.properties||{};
    cols[t]=Object.entries<any>(pr).map(([k,v])=>k+":"+(v.format||v.type));
  }
  const q=async(t:string)=>{const x=await fetch(`${url}/rest/v1/${t}`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});return x.json().catch(()=>null)};
  const pk:any[]=(await q("picks?select=pick,match_id,league&order=created_at.desc&limit=40"))||[];
  const pr:any[]=(await q("predictions?select=match_id,pick,likely,model_version,league&order=created_at.desc&limit=4"))||[];
  const np:any[]=(await q("players?select=id&limit=1000"))||[];
  return Response.json({pickValues:[...new Set(pk.map(x=>x.pick))],pickMatchIds:pk.slice(0,3).map(x=>x.match_id+" | "+x.league),predSamples:pr,players:Array.isArray(np)?np.length:null});
}
