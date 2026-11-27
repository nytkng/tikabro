// SEO: عناوين، أوصاف، روابط canonical و JSON-LD. خفيف، بلا مكتبات.
import type {Metadata} from "next";
import type {Match} from "./types";
import {arLeague} from "./arabic";
export const SITE_URL=(process.env.SITE_URL||"https://tikabro.thenytkng.workers.dev").replace(/\/$/,"");
export const SITE_NAME="هدف";
export const OG_IMAGE={url:"/opengraph-image",width:1200,height:630,alt:"HADAF"};
export const TOP_LEAGUES:[string,string][]=[["soccer","eng.1"],["soccer","esp.1"],["soccer","ita.1"],["soccer","ger.1"],["soccer","fra.1"],["soccer","uefa.champions"],["soccer","alg.1"],["soccer","caf.champions"],["soccer","ksa.1"],["basketball","nba"],["hockey","nhl"],["football","nfl"],["baseball","mlb"]];
export const IND_SPORTS_SEO=["tennis","golf","f1","ufc","racing"];
export const matchPath=(id:string)=>`/match/${encodeURIComponent(id)}`;
const fmtKick=(iso:string)=>{try{return new Date(iso).toLocaleString("ar-DZ",{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit",timeZone:"Africa/Algiers"})}catch{return ""}};
export function pageMeta(title:string,description:string,path:string):Metadata{
  return {title:{absolute:title},description,alternates:{canonical:path},
    openGraph:{type:"website",siteName:SITE_NAME,locale:"ar_DZ",title,description,url:path,images:[OG_IMAGE]},
    twitter:{card:"summary_large_image",title,description,images:[OG_IMAGE.url]}};
}
export function matchMeta(m:Match):Metadata{
  const title=`توقع مباراة ${m.home} ضد ${m.away} — ${m.league} | ${SITE_NAME}`;
  const p=m.probs;const draw=p&&p.d>0;
  const pct=p?` توقع الذكاء الاصطناعي: فوز ${m.home} ${Math.round(p.h)}%${draw?`، تعادل ${Math.round(p.d)}%`:""}، فوز ${m.away} ${Math.round(p.a)}%.`:"";
  const k=fmtKick(m.kickoff);
  const desc=`${m.home} ضد ${m.away} في ${m.league}${k?`، ${k} بتوقيت الجزائر`:""}.${pct} توقّع أنت وتحدّى الـ AI — للتوقعات فقط، بلا مراهنة.`;
  return pageMeta(title,desc,matchPath(m.id));
}
export function leagueMeta(sport:string,slug:string,name?:string|null):Metadata{
  const n=arLeague(slug,name)||slug;
  return pageMeta(`توقعات ${n} — مباريات وترتيب | ${SITE_NAME}`,`توقعات الذكاء الاصطناعي لمباريات ${n}، جدول الترتيب والنتائج بتوقيت الجزائر. للتوقعات فقط، بلا مراهنة.`,`/league/${sport}/${slug}`);
}
export function sportsEventLd(m:Match){
  const status=m.state==="void"?"https://schema.org/EventCancelled":"https://schema.org/EventScheduled";
  return {"@context":"https://schema.org","@type":"SportsEvent",name:`${m.home} ضد ${m.away}`,startDate:m.kickoff,sport:m.sport,
    eventStatus:status,url:SITE_URL+matchPath(m.id),description:m.league,
    homeTeam:{"@type":"SportsTeam",name:m.home,...(m.homeLogo?{logo:m.homeLogo}:{})},
    awayTeam:{"@type":"SportsTeam",name:m.away,...(m.awayLogo?{logo:m.awayLogo}:{})},
    competitor:[{"@type":"SportsTeam",name:m.home},{"@type":"SportsTeam",name:m.away}]};
}
