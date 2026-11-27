export async function GET(){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_KEY;
  const out:Record<string,unknown>={ok:true,env_url:!!url,env_key:!!key};
  if(url&&key){
    out.url_shape=/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)?"ok":"unexpected";
    out.key_prefix=key.startsWith("sb_secret_")?"sb_secret":key.startsWith("eyJ")?"jwt":"unknown";
    try{
      const r=await fetch(`${url}/rest/v1/predictions?select=id&limit=1`,{headers:{apikey:key,...(key.startsWith("sb_")?{}:{Authorization:`Bearer ${key}`})},cache:"no-store"});
      out.status=r.status;
      if(!r.ok){const t=await r.text();out.error=t.slice(0,160);}
      out.db=r.ok?"connected":"failed";
    }catch(e){out.db="network_error";out.error=String((e as Error).message).slice(0,120);}
  }else out.db="not_configured";
  return Response.json(out,{headers:{"Cache-Control":"no-store"}});
}
