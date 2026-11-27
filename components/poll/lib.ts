import {db} from "@/lib/db";
export type Poll={id:string;code:string;match_id:string;closes_at:string;closed:boolean};
export type Counts={home:number;draw:number;away:number};
export const CODE=/^\d{4}$/;
export const isOpen=(p:Poll)=>!p.closed&&Date.parse(p.closes_at)>Date.now();
export async function pollByCode(code:string){
  if(!CODE.test(code))return null;
  const r=await db<Poll[]>(`polls?code=eq.${code}&select=id,code,match_id,closes_at,closed&limit=1`);return r?.[0]||null;
}
export async function openPollForMatch(eid:string){
  const r=await db<Poll[]>(`polls?match_id=eq.${encodeURIComponent(eid)}&closed=is.false&closes_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,code,match_id,closes_at,closed&order=created_at.desc&limit=1`);return r?.[0]||null;
}
export async function pollCounts(id:string):Promise<Counts>{
  const r=await db<any>("rpc/poll_counts",{method:"POST",body:JSON.stringify({p_poll:id})});
  const x=Array.isArray(r)?r[0]:r;return {home:+(x?.home||0),draw:+(x?.draw||0),away:+(x?.away||0)};
}
