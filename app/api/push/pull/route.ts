// الهاتف يجبد رسائلو بعد الدقة.
import {NextResponse} from "next/server";
import {db,dbRaw} from "@/lib/db";
export async function POST(req:Request){
  const j=await req.json().catch(()=>null);const ep=String(j?.endpoint||"");
  if(!/^https:\/\//.test(ep))return NextResponse.json({items:[]});
  const q=`endpoint=eq.${encodeURIComponent(ep)}&delivered_at=is.null`;
  const items=(await db<{id:number;title:string;body:string;url:string}[]>(`push_queue?${q}&select=id,title,body,url&order=id.asc&limit=5`))||[];
  if(items.length)await dbRaw(`push_queue?id=in.(${items.map(i=>i.id).join(",")})`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({delivered_at:new Date().toISOString()})});
  return NextResponse.json({items});
}
