export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {db} from "@/lib/db";
import {COOKIE,cookieOpts,cookieValue,signVal} from "@/lib/auth";
import {GS,GP,gOpts,googleHash,googleOn,redirectUri} from "@/lib/google";
const back=(req:Request,q:string)=>NextResponse.redirect(new URL("/login?g="+q,req.url));
export async function GET(req:Request){
  if(!googleOn())return back(req,"off");
  const u=new URL(req.url),code=u.searchParams.get("code"),state=u.searchParams.get("state");
  const jar=await cookies();const want=jar.get(GS)?.value;
  if(!code||!state||!want||state!==want)return back(req,"fail");
  let sub:string;
  try{
    const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,redirect_uri:redirectUri(req),grant_type:"authorization_code"})});
    if(!r.ok)return back(req,"fail");
    const j:any=await r.json();
    // التوكن جا مباشرة من جوجل عبر HTTPS، نتحقق من الجمهور والمصدر والصلاحية
    const p=JSON.parse(atob(String(j.id_token).split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
    if(p.aud!==process.env.GOOGLE_CLIENT_ID||!["accounts.google.com","https://accounts.google.com"].includes(p.iss)||p.exp*1000<Date.now()||!p.sub)return back(req,"fail");
    sub=String(p.sub);
  }catch{return back(req,"fail")}
  const h=await googleHash(sub);
  const found=await db<{id:string}[]>(`players?google_hash=eq.${h}&select=id&limit=1`);
  if(found===null)return back(req,"fail");
  let res:NextResponse;
  if(found[0]){res=NextResponse.redirect(new URL("/",req.url));res.cookies.set(COOKIE,await cookieValue(found[0].id),cookieOpts)}
  else{res=back(req,"new");res.cookies.set(GP,await signVal(h),gOpts)}
  res.cookies.delete(GS);return res;
}
