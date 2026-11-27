import type {Match,Sport} from "./types";
import {predict,predictDC,predictTwoWay,type Rec,type TeamGoals} from "./model";
const FEEDS:{sport:Sport;path:string}[]=[
 {sport:"football",path:"soccer/eng.1"},{sport:"football",path:"soccer/esp.1"},{sport:"football",path:"soccer/ger.1"},
 {sport:"football",path:"soccer/ita.1"},{sport:"football",path:"soccer/fra.1"},{sport:"football",path:"soccer/uefa.champions"},
 {sport:"football",path:"soccer/caf.champions"},{sport:"basketball",path:"basketball/nba"},
];
const parse=(s?:string):Rec|null=>{const a=(s||"").split("-").map(x=>parseInt(x,10));
 return a.length>=3&&a.every(x=>!isNaN(x))?{w:a[0],d:a[1],l:a[2]}:a.length===2&&a.every(x=>!isNaN(x))?{w:a[0],d:0,l:a[1]}:null};
const total=(r:Rec|null)=>r?r.w+r.d+r.l:0;
// سجل الفريق: الكلي + سجل الأرض/الخارج إن وُجد (أدقّ في التوقع)
function recs(c:any){
  const list:any[]=c?.records||[];
  const by=(t:string)=>parse(list.find(x=>x.type===t||x.name?.toLowerCase()===t)?.summary);
  return {all:parse(list[0]?.summary),home:by("home"),road:by("road")||by("away")};
}
// أهداف الفريق من جدول الترتيب (مرة كل 6 ساعات)
async function goalsMap(path:string):Promise<{map:Map<string,TeamGoals>;avg:number}|null>{
  try{
    const r=await fetch(`https://site.api.espn.com/apis/v2/sports/${path}/standings`,{next:{revalidate:21600}} as any);
    if(!r.ok)return null;
    const j:any=await r.json();
    const entries:any[]=[];
    const walk=(n:any)=>{if(!n)return;if(n.standings?.entries)entries.push(...n.standings.entries);(n.children||[]).forEach(walk)};
    walk(j);
    const map=new Map<string,TeamGoals>();let gf=0,gp=0;
    for(const e of entries){
      const st=(k:string)=>Number((e.stats||[]).find((s:any)=>s.name===k)?.value);
      const g=st("gamesPlayed"),f=st("pointsFor"),a=st("pointsAgainst");
      if(!e.team?.id||![g,f,a].every(x=>isFinite(x))||g<=0)continue;
      map.set(String(e.team.id),{gp:g,gf:f,ga:a});gf+=f;gp+=g;
    }
    return map.size>=4&&gp>0?{map,avg:gf/gp}:null;
  }catch{return null}
}
export async function fetchDay(date:string):Promise<Match[]>{
  const ymd=date.replace(/-/g,"");
  const out:Match[]=[];
  await Promise.all(FEEDS.map(async f=>{
    try{
      const [r,gm]=await Promise.all([
        fetch(`https://site.api.espn.com/apis/site/v2/sports/${f.path}/scoreboard?dates=${ymd}`,{next:{revalidate:60}} as any),
        f.sport==="football"?goalsMap(f.path):Promise.resolve(null),
      ]);
      if(!r.ok)return;
      const j:any=await r.json();
      for(const e of j.events||[]){
        const c=e.competitions?.[0];if(!c)continue;
        const h=c.competitors?.find((x:any)=>x.homeAway==="home"),a=c.competitors?.find((x:any)=>x.homeAway==="away");
        if(!h||!a)continue;
        const st=e.status?.type?.state;
        const hs=parseInt(h.score,10),as=parseInt(a.score,10);
        const hr=recs(h),ar=recs(a);
        let probs;
        const hg=gm?.map.get(String(h.team?.id)),ag=gm?.map.get(String(a.team?.id));
        if(f.sport==="football"&&gm&&hg&&ag&&hg.gp>=3&&ag.gp>=3)probs=predictDC(hg,ag,{avg:gm.avg});
        else if(total(hr.all)>0&&total(ar.all)>0){
          // نعتمد سجل الأرض لأصحاب الأرض وسجل الخارج للضيف إذا توفرا بعينة كافية، وإلا الكلي
          const H=total(hr.home)>=4?hr.home!:hr.all!,A=total(ar.road)>=4?ar.road!:ar.all!;
          probs=f.sport==="basketball"?predictTwoWay(H,A):predict(H,A);
        }
        out.push({id:`${f.path.replace("/","-")}:${e.id}`,sport:f.sport,league:j.leagues?.[0]?.name||f.path,
          home:h.team.displayName,away:a.team.displayName,kickoff:e.date,
          state:st==="in"?"live":st==="post"?"post":"pre",
          score:isNaN(hs)||isNaN(as)||st==="pre"?undefined:[hs,as],
          probs,source:"espn"});
      }
    }catch{}
  }));
  return out.sort((x,y)=>x.kickoff.localeCompare(y.kickoff));
}
