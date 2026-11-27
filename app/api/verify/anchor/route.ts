// ختم الجذر اليومي في OpenTimestamps (pg_net ما يبعثش body ثنائي، لذلك هنا). محمي بـ CRON_SECRET.
export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {db,dbRaw} from "@/lib/db";

function same(a:string,b:string){
  if(a.length!==b.length)return false;
  let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);
  return d===0;
}
const CALS=["https://a.pool.opentimestamps.org","https://b.pool.opentimestamps.org"];
// نختمو sha256 للنص "root_hash" (ملف نصي root.txt) باش أي واحد يقدر يرفع الملف + .ots في opentimestamps.org
const MAGIC=[0x00,0x4f,0x70,0x65,0x6e,0x54,0x69,0x6d,0x65,0x73,0x74,0x61,0x6d,0x70,0x73,0x00,0x00,0x50,0x72,0x6f,0x6f,0x66,0x00,0xbf,0x89,0xe2,0xe8,0x84,0xe8,0x92,0x94,0x01,0x08];
const b64=(u:Uint8Array)=>{let s="";for(const c of u)s+=String.fromCharCode(c);return btoa(s)};

export async function GET(req:Request){
  const secret=process.env.CRON_SECRET?.trim();
  if(!secret)return NextResponse.json({error:"CRON_SECRET not set"},{status:503});
  const got=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!same(got,secret))return NextResponse.json({error:"unauthorized"},{status:401});

  // نحسب جذر البارح إذا ما تحسبش (الدالة idempotent)
  await dbRaw("rpc/hadaf_ledger_root",{method:"POST",body:"{}"});
  const rows=await db<{day:string;root_hash:string}[]>("daily_roots?ots_proof=is.null&root_hash=not.is.null&select=day,root_hash&order=day.desc&limit=3");
  if(!rows)return NextResponse.json({error:"db read failed"},{status:502});
  const out:{day:string;ok:boolean;cal?:string}[]=[];
  for(const r of rows){
    if(!/^[0-9a-f]{64}$/.test(r.root_hash)){out.push({day:r.day,ok:false});continue}
    const dg=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(r.root_hash)));
    let proof:Uint8Array|null=null,cal="";
    for(const c of CALS){
      try{
        const x=await fetch(`${c}/digest`,{method:"POST",headers:{"Content-Type":"application/octet-stream",Accept:"application/vnd.opentimestamps.v1"},body:dg});
        if(x.ok){const part=new Uint8Array(await x.arrayBuffer());proof=new Uint8Array([...MAGIC,...dg,...part]);cal=c;break}
      }catch{}
    }
    if(!proof){out.push({day:r.day,ok:false});continue}
    const now=new Date().toISOString();
    const w=await dbRaw(`daily_roots?day=eq.${r.day}&ots_proof=is.null`,{method:"PATCH",headers:{Prefer:"return=minimal"},
      body:JSON.stringify({ots_proof:b64(proof),submitted_at:now,proof_at:now})});
    out.push({day:r.day,ok:w.ok,cal});
  }
  return NextResponse.json({anchored:out});
}
