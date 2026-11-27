import {NextResponse} from "next/server";
import {LANG_COOKIE,isLang} from "@/lib/i18n";
export async function POST(req:Request){
  const j=await req.json().catch(()=>({}));
  const lang=isLang(j?.lang)?j.lang:"ar";
  const res=NextResponse.json({ok:true,lang});
  res.cookies.set(LANG_COOKIE,lang,{path:"/",maxAge:60*60*24*365,sameSite:"lax"});
  return res;
}
