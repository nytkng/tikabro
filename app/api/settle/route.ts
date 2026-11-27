// حسم النتائج: يقرا المباريات المنتهية من ESPN ويكتب النتيجة في predictions ثم ينادي settle_picks.
// محمي بسر CRON_SECRET. المفاتيح تبقى في الخادم.
export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {db,dbRaw} from "@/lib/db";

type P={match_id:string;league:string;kickoff:string;p_home:number|null;p_draw:number|null;p_away:number|null};
const LIMIT=20; // حد الطلبات الفرعية في Cloudflare المجاني = 50 (20 ESPN + 20 PATCH + 2)

function same(a:string,b:string){
  if(a.length!==b.length)return false;
  let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);
  return d===0;
}

async function result(p:P):Promise<{rh:number;ra:number}|"skip">{
  const sport=p.league==="nba"?"basketball":"soccer";
  try{
    const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${p.league}/summary?event=${p.match_id}`,{cache:"no-store"});
    if(!r.ok)return "skip";
    const j:any=await r.json();
    const c=j?.header?.competitions?.[0];
    if(!c||c.status?.type?.state!=="post"||c.status?.type?.completed!==true)return "skip";
    const h=c.competitors?.find((x:any)=>x.homeAway==="home"),a=c.competitors?.find((x:any)=>x.homeAway==="away");
    const rh=parseInt(h?.score,10),ra=parseInt(a?.score,10);
    if(isNaN(rh)||isNaN(ra))return "skip";
    return {rh,ra};
  }catch{return "skip"}
}

export async function GET(req:Request){
  const secret=process.env.CRON_SECRET?.trim();
  if(!secret)return NextResponse.json({error:"CRON_SECRET not set"},{status:503});
  const got=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!same(got,secret))return NextResponse.json({error:"unauthorized"},{status:401});

  const before=new Date(Date.now()-2*3600e3).toISOString();
  const rows=await db<P[]>(`predictions?settled_at=is.null&void=eq.false&kickoff=lt.${encodeURIComponent(before)}&select=match_id,league,kickoff,p_home,p_draw,p_away&order=kickoff.asc&limit=${LIMIT}`);
  if(!rows)return NextResponse.json({error:"db read failed"},{status:502});

  let done=0,skipped=0,failed=0;
  const res=await Promise.all(rows.map(async p=>({p,r:await result(p)})));
  for(const {p,r} of res){
    if(r==="skip"){skipped++;continue}
    const outcome=r.rh>r.ra?"home":r.rh<r.ra?"away":"draw";
    const ph=p.p_home??0,pd=p.p_draw??0,pa=p.p_away??0;
    const best=Math.max(ph,pd,pa);
    const pickOut=best===ph?"home":best===pa?"away":"draw";
    const brier=(ph-(outcome==="home"?1:0))**2+(pd-(outcome==="draw"?1:0))**2+(pa-(outcome==="away"?1:0))**2;
    const w=await dbRaw(`predictions?match_id=eq.${encodeURIComponent(p.match_id)}&settled_at=is.null`,{
      method:"PATCH",headers:{Prefer:"return=minimal"},
      body:JSON.stringify({result_home:r.rh,result_away:r.ra,outcome,hit:pickOut===outcome,brier,settled_at:new Date().toISOString()}),
    });
    if(w.ok)done++;else failed++;
  }
  // ننقل النتيجة لتوقعات اللاعبين (الدالة موجودة في قاعدة البيانات)
  const s=await dbRaw("rpc/settle_picks",{method:"POST",body:"{}"});
  return NextResponse.json({ok:true,checked:rows.length,settled:done,skipped,failed,picks:s.ok?s.json:null,picks_error:s.ok?undefined:s.json?.message});
}
