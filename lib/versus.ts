// البشر ضد الآلة: نسبة الإصابة في آخر 7 أيام، على نفس المباريات اللي فيها توقعات بشر.
import {db} from "./db";
export type Versus={humans:number;ai:number;picks:number;matches:number}|null;
export async function weekVersus():Promise<Versus>{
  const since=encodeURIComponent(new Date(Date.now()-7*864e5).toISOString());
  const [picks,preds]=await Promise.all([
    db<{match_id:string;hit:boolean|null}[]>(`picks?settled_at=gte.${since}&void=not.is.true&select=match_id,hit&limit=20000`),
    db<{match_id:string;hit:boolean|null}[]>(`predictions?settled_at=gte.${since}&void=eq.false&select=match_id,hit&limit=5000`),
  ]);
  if(!picks||!preds)return null;
  const p=picks.filter(x=>x.hit!==null);
  const ids=new Set(p.map(x=>x.match_id));
  const a=preds.filter(x=>ids.has(x.match_id)&&x.hit!==null);
  if(p.length<5||a.length<3)return null;
  return {humans:Math.round(100*p.filter(x=>x.hit).length/p.length),ai:Math.round(100*a.filter(x=>x.hit).length/a.length),picks:p.length,matches:a.length};
}
