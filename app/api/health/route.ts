export const dynamic = "force-dynamic";
import {supaOrigin} from "@/lib/supa";
export async function GET(){
  const raw=process.env.SUPABASE_URL;const url=supaOrigin(raw);const key=process.env.SUPABASE_SERVICE_KEY?.trim();
  const out:Record<string,unknown>={ok:true,env_url:!!raw,env_key:!!key};
  if(url&&key){
    const host=new URL(url).hostname;
    out.url_clean=url!==raw?.trim();
    out.host_ok=/^[a-z0-9]{20}\.supabase\.co$/.test(host);
    out.host_len=host.length;
    out.key_prefix=key.startsWith("sb_secret_")?"sb_secret":key.startsWith("eyJ")?"jwt":"unknown";
    try{
      const r=await fetch(`${url}/rest/v1/predictions?select=id&limit=1`,{headers:{apikey:key,...(key.startsWith("sb_")?{}:{Authorization:`Bearer ${key}`})},cache:"no-store"});
      out.status=r.status;
      if(!r.ok){out.error=(await r.text()).slice(0,160);}
      out.db=r.ok?"connected":"failed";
    }catch(e){out.db="network_error";out.error=String((e as Error).message).slice(0,120);}
  }else out.db="not_configured";
  return Response.json(out,{headers:{"Cache-Control":"no-store"}});
}
