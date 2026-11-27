import type {Match,Sport} from "./types";
import {predict} from "./model";
const FEEDS:{sport:Sport;path:string}[]=[
 {sport:"football",path:"soccer/eng.1"},{sport:"football",path:"soccer/esp.1"},{sport:"football",path:"soccer/ger.1"},
 {sport:"football",path:"soccer/ita.1"},{sport:"football",path:"soccer/fra.1"},{sport:"football",path:"soccer/uefa.champions"},
 {sport:"football",path:"soccer/caf.champions"},{sport:"basketball",path:"basketball/nba"},
];
type Rec={w:number;d:number;l:number};
const rec=(c:any):Rec=>{const s=(c?.records?.[0]?.summary||"").split("-").map((x:string)=>parseInt(x,10));
 return s.length>=3&&s.every((x:number)=>!isNaN(x))?{w:s[0],d:s[1],l:s[2]}:{w:0,d:0,l:0}};
export async function fetchDay(date:string):Promise<Match[]>{
  const ymd=date.replace(/-/g,"");
  const out:Match[]=[];
  await Promise.all(FEEDS.map(async f=>{
    try{
      const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${f.path}/scoreboard?dates=${ymd}`,{next:{revalidate:60}} as any);
      if(!r.ok)return;
      const j:any=await r.json();
      for(const e of j.events||[]){
        const c=e.competitions?.[0];if(!c)continue;
        const h=c.competitors?.find((x:any)=>x.homeAway==="home"),a=c.competitors?.find((x:any)=>x.homeAway==="away");
        if(!h||!a)continue;
        const st=e.status?.type?.state;
        const hs=parseInt(h.score,10),as=parseInt(a.score,10);
        const hasRec=rec(h).w+rec(h).d+rec(h).l>0&&rec(a).w+rec(a).d+rec(a).l>0;
        out.push({id:`${f.path.replace("/","-")}:${e.id}`,sport:f.sport,league:j.leagues?.[0]?.name||f.path,
          home:h.team.displayName,away:a.team.displayName,kickoff:e.date,
          state:st==="in"?"live":st==="post"?"post":"pre",
          score:isNaN(hs)||isNaN(as)||st==="pre"?undefined:[hs,as],
          probs:hasRec?predict(rec(h),rec(a)):undefined,source:"espn"});
      }
    }catch{}
  }));
  return out.sort((x,y)=>x.kickoff.localeCompare(y.kickoff));
}
