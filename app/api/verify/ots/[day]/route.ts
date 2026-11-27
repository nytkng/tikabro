// تحميل ملف .ots لجذر يوم معيّن
export const dynamic="force-dynamic";
import {db} from "@/lib/db";

export async function GET(req:Request,{params}:{params:Promise<{day:string}>}){
  const {day}=await params;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return new Response("bad day",{status:400});
  const r=await db<{ots_proof:string|null;root_hash:string|null}[]>(`daily_roots?day=eq.${day}&select=ots_proof,root_hash`);
  if(new URL(req.url).searchParams.has("txt")){
    const h=r?.[0]?.root_hash;if(!h)return new Response("not found",{status:404});
    return new Response(h,{headers:{"Content-Type":"text/plain","Content-Disposition":`attachment; filename="hadaf-${day}.txt"`}});
  }
  const p=r?.[0]?.ots_proof;
  if(!p)return new Response("not found",{status:404});
  const bin=atob(p),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  return new Response(u,{headers:{"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename="hadaf-${day}.txt.ots"`,"Cache-Control":"public, max-age=3600"}});
}
