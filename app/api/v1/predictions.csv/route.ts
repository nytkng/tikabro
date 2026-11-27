// تنزيل CSV للتوقعات المختومة (أقصى مدة 31 يوم). بلا بيانات مستخدمين.
import {openPredictions,isDay,todayDZ,addDays,FIELDS,csvCell,LICENSE,ATTRIBUTION} from "@/lib/opendata";
import {limit,ipKey} from "@/lib/ratelimit";
export const dynamic="force-dynamic";
const C={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, OPTIONS"};
const err=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers:{...C,"Content-Type":"application/json","Cache-Control":"no-store"}});
export function OPTIONS(){return new Response(null,{status:204,headers:C})}
export async function GET(req:Request){
  const u=new URL(req.url);
  for(const k of u.searchParams.keys())if(k!=="from"&&k!=="to")return err(400,`unknown parameter: ${k}`);
  const to=u.searchParams.get("to")??todayDZ(),from=u.searchParams.get("from")??addDays(to,-6);
  if(!isDay(from)||!isDay(to))return err(400,"from/to must be YYYY-MM-DD");
  const span=(Date.parse(to)-Date.parse(from))/864e5;
  if(span<0)return err(400,"from must be <= to");
  if(span>30)return err(400,"range max 31 days");
  if(!await limit(ipKey("api-v1",req),60,60))return err(429,"rate limit: 60 requests/minute");
  const enc=new TextEncoder();let d=from;let failed=false;
  // نجيبو يوم بيوم ونبعثو مباشرة (streaming)
  const stream=new ReadableStream<Uint8Array>({
    start(c){c.enqueue(enc.encode(`# license: ${LICENSE}; attribution: ${ATTRIBUTION}\n${FIELDS.join(",")}\n`))},
    async pull(c){
      if(d>to||failed){c.close();return}
      const rows=await openPredictions(d,d,1000);
      if(!rows){failed=true;c.enqueue(enc.encode(`# error: data unavailable from ${d}\n`))}
      else if(rows.length)c.enqueue(enc.encode(rows.map(r=>FIELDS.map(f=>csvCell((r as Record<string,unknown>)[f])).join(",")).join("\n")+"\n"));
      d=addDays(d,1);
    }});
  return new Response(stream,{headers:{...C,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="hadaf-predictions-${from}_${to}.csv"`,"Cache-Control":"public, max-age=300, s-maxage=300"}});
}
