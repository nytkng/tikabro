// هوية اللاعب: كوكي موقّع HMAC (httpOnly). لا كلمة سر. الكود السري للاسترجاع يُخزَّن مُجزَّأ فقط.
import {cookies} from "next/headers";
import {db} from "./db";
const enc=new TextEncoder();
const hex=(b:ArrayBuffer)=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
export const sha256=async(s:string)=>hex(await crypto.subtle.digest("SHA-256",enc.encode(s)));
async function hmac(msg:string){
  // PLAYER_SECRET إن وُجد، وإلا نشتق سرا من مفتاح الخدمة (لا يخرج أبدا)
  const base=process.env.PLAYER_SECRET||("hadaf-player:"+(process.env.SUPABASE_SERVICE_KEY||"dev"));
  const k=await crypto.subtle.importKey("raw",enc.encode(base),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(await crypto.subtle.sign("HMAC",k,enc.encode(msg)));
}
export const COOKIE="hadaf_p";
// توقيع قيمة عامة (للكوكي المؤقت تاع جوجل)
export const signVal=async(v:string)=>`${v}.${await hmac("v:"+v)}`;
export async function unsignVal(s?:string){
  if(!s)return null;const i=s.lastIndexOf(".");if(i<1)return null;
  const v=s.slice(0,i),sig=s.slice(i+1),want=await hmac("v:"+v);
  if(sig.length!==want.length)return null;let d=0;for(let j=0;j<want.length;j++)d|=sig.charCodeAt(j)^want.charCodeAt(j);
  return d===0?v:null;
}
export const cookieValue=async(id:string)=>`${id}.${await hmac(id)}`;
export const cookieOpts={httpOnly:true,secure:true,sameSite:"lax" as const,path:"/",maxAge:60*60*24*365};
export type Player={id:string;nick:string;hue:number|null;bio:string|null};
export async function verifyCookie(v?:string):Promise<string|null>{
  if(!v)return null;const i=v.lastIndexOf(".");if(i<1)return null;
  const id=v.slice(0,i),sig=v.slice(i+1);
  if(!/^[0-9a-f-]{36}$/.test(id))return null;
  const want=await hmac(id);if(sig.length!==want.length)return null;
  let d=0;for(let j=0;j<want.length;j++)d|=sig.charCodeAt(j)^want.charCodeAt(j); // مقارنة بوقت ثابت
  return d===0?id:null;
}
export async function currentPlayer():Promise<Player|null>{
  try{
    const id=await verifyCookie((await cookies()).get(COOKIE)?.value);
    if(!id)return null;
    const r=await db<Player[]>(`players?id=eq.${id}&select=id,nick,hue,bio&limit=1`);
    return r?.[0]??null;
  }catch{return null}
}
export const NICK_RE=/^[\p{L}\p{N}_]{3,20}$/u;
const RESERVED=["hadaf","admin","ai","هدف","ادمن","مدير","support"];
export const nickOk=(n:string)=>NICK_RE.test(n)&&!RESERVED.includes(n.toLowerCase());
export function newCode(){
  const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";const b=crypto.getRandomValues(new Uint8Array(12));
  const s=[...b].map(x=>A[x%A.length]).join("");return s.slice(0,4)+"-"+s.slice(4,8)+"-"+s.slice(8);
}
export async function turnstileOk(token:string|undefined,ip?:string){
  const sec=process.env.TURNSTILE_SECRET;if(!sec)return true; // غير مفعّل بعد
  if(!token)return false;
  try{
    const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({secret:sec,response:token,...(ip?{remoteip:ip}:{})})});
    return !!(await r.json() as any).success;
  }catch{return false}
}
