// وضع الإنترنت الضعيف: كوكي برك، ونرجعو لنفس الصفحة.
import {NextResponse} from "next/server";
export async function GET(req:Request){
  const u=new URL(req.url);const on=u.searchParams.get("on")==="1";
  let back=u.searchParams.get("back")||"";if(!back){try{const r=new URL(req.headers.get("referer")||"");if(r.origin===u.origin)back=r.pathname+r.search}catch{}}if(!back)back="/";if(!back.startsWith("/")||back.startsWith("//"))back="/";
  const res=NextResponse.redirect(new URL(back,u.origin),303);
  res.cookies.set("hadaf_lite",on?"1":"0",{path:"/",maxAge:60*60*24*365,sameSite:"lax"});
  return res;
}
