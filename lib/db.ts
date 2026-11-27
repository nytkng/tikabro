// عميل PostgREST بسيط. للخادم فقط. المفتاح لا يخرج أبدا للمتصفح.
export async function db<T=unknown>(path:string,init:RequestInit={}):Promise<T|null>{
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_KEY;
  if(!url||!key)return null;
  const r=await fetch(`${url}/rest/v1/${path}`,{...init,headers:{apikey:key,...(key.startsWith("sb_")?{}:{Authorization:`Bearer ${key}`}),"Content-Type":"application/json",...(init.headers||{})},cache:"no-store"});
  if(!r.ok)return null;
  return (await r.json()) as T;
}
