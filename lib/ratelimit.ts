// حدّ الطلبات عبر RPC hit_rate. لا نخزّن الـIP الخام أبدا (SHA-256 + ملح ثابت).
import {dbRaw} from "./db";
const SALT="hadaf-rl-v1:";
async function h(s:string){
  const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(SALT+s));
  return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
export function clientIp(req:Request){return req.headers.get("CF-Connecting-IP")||req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown"}
/** true = مسموح. يفتح (fail-open) فقط إذا الدالة غير موجودة/لا ترجع قيمة. */
export async function limit(key:string,windowSeconds:number,max:number):Promise<boolean>{
  const r=await dbRaw("rpc/hit_rate",{method:"POST",body:JSON.stringify({p_key:await h(key),p_window_seconds:windowSeconds,p_max:max})});
  if(typeof r.json!=="boolean")return true;
  return r.json;
}
export const ipKey=(scope:string,req:Request)=>`${scope}:ip:${clientIp(req)}`;
export const TOO_MANY="محاولات كثيرة، استنى شوية وعاود.";
