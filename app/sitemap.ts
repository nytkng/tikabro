import type {MetadataRoute} from "next";
import {db} from "@/lib/db";
import {SITE_URL,TOP_LEAGUES,IND_SPORTS_SEO} from "@/lib/seo";
export const revalidate=3600;
type R={eid:string;sport:string;slug:string|null;kickoff:string};
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const now=new Date();
  const fixed:MetadataRoute.Sitemap=[
    {url:SITE_URL+"/",changeFrequency:"hourly",priority:1,lastModified:now},
    ...["/ai","/rankings","/leaders","/groups"].map(p=>({url:SITE_URL+p,changeFrequency:"daily" as const,priority:0.7})),
    ...IND_SPORTS_SEO.map(s=>({url:`${SITE_URL}/individual/${s}`,changeFrequency:"daily" as const,priority:0.6})),
    ...TOP_LEAGUES.map(([s,l])=>({url:`${SITE_URL}/league/${s}/${l}`,changeFrequency:"daily" as const,priority:0.7})),
  ];
  let rows:R[]|null=null;
  try{
    const today=now.toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
    const start=new Date(today+"T00:00:00+01:00").toISOString(),end=new Date(Date.parse(start)+2*864e5).toISOString();
    rows=await db<R[]>(`matches?kickoff=gte.${encodeURIComponent(start)}&kickoff=lt.${encodeURIComponent(end)}&select=eid,sport,slug,kickoff&order=kickoff.asc&limit=500`);
  }catch{}
  const matches=(rows||[]).map(r=>({url:`${SITE_URL}/match/${encodeURIComponent(`${r.sport}-${r.slug||"all"}:${r.eid}`)}`,changeFrequency:"hourly" as const,priority:0.8,lastModified:now}));
  const tr=await db<{key:string}[]>(`team_ratings?n=gte.10&select=key&order=elo.desc&limit=1000`).catch(()=>null);
  const teams=(tr||[]).map(r=>{const [sp,i]=r.key.split(":");return {url:`${SITE_URL}/team/${sp}/${i}`,changeFrequency:"daily" as const,priority:0.6}});
  return [...fixed,...matches,...teams];
}
