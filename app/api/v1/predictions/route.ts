// API مفتوح للقراءة: توقعات الـ AI المختومة ليوم واحد. بلا بيانات مستخدمين.
import {openPredictions,isDay,todayDZ,LICENSE,ATTRIBUTION} from "@/lib/opendata";
import {limit,ipKey} from "@/lib/ratelimit";
export const dynamic="force-dynamic";
const H={"Cache-Control":"public, max-age=300, s-maxage=300","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const err=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers:{...H,"Cache-Control":"no-store"}});
export function OPTIONS(){return new Response(null,{status:204,headers:H})}
export async function GET(req:Request){
  const u=new URL(req.url);
  for(const k of u.searchParams.keys())if(k!=="date")return err(400,`unknown parameter: ${k}`);
  const date=u.searchParams.get("date")??todayDZ();
  if(!isDay(date))return err(400,"date must be YYYY-MM-DD");
  if(!await limit(ipKey("api-v1",req),60,60))return err(429,"rate limit: 60 requests/minute");
  const rows=await openPredictions(date,date,1000);
  if(!rows)return err(503,"data temporarily unavailable");
  return new Response(JSON.stringify({date,timezone:"Africa/Algiers",count:rows.length,license:LICENSE,attribution:ATTRIBUTION,predictions:rows}),{headers:H});
}
