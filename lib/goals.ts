import {db} from "@/lib/db";
import {teamIds} from "@/lib/feed";
import type {TeamGoals} from "@/lib/model";
type Row={gp:number;gf:number;ga:number;home_gf:number;home_ga:number;away_gf:number;away_ga:number};
const rpc=<T,>(fn:string,body:unknown)=>db<T>(`rpc/${fn}`,{method:"POST",body:JSON.stringify(body)});
/** مدخلات Dixon-Coles من نتائجنا المخزنة (آخر 12 مباراة) — null إذا العينة أقل من 5 لأي فريق. */
export async function dbGoals(eid:string,slug:string|undefined):Promise<{h:TeamGoals;a:TeamGoals;avg:number}|null>{
  const ids=await teamIds(eid);if(!ids)return null;
  const [h,a,avg]=await Promise.all([
    rpc<Row[]>("team_goals",{p_sport:"soccer",p_team:ids.h,p_n:12}),
    rpc<Row[]>("team_goals",{p_sport:"soccer",p_team:ids.a,p_n:12}),
    slug&&slug!=="all"?rpc<number>("league_goal_avg",{p_slug:slug}):Promise.resolve(1.35),
  ]);
  const hr=h?.[0],ar=a?.[0];if(!hr||!ar||hr.gp<5||ar.gp<5)return null;
  return {h:{gp:hr.gp,gf:hr.gf,ga:hr.ga},a:{gp:ar.gp,gf:ar.gf,ga:ar.ga},avg:typeof avg==="number"&&avg>0?avg:1.35};
}
export type MarketStat={market:"btts"|"over25";n:number;hit_rate:number|null;brier:number|null};
export const marketsSummary=()=>rpc<MarketStat[]>("ai_markets_summary",{}).catch(()=>null);
