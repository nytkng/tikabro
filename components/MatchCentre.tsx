import {arLeague} from "@/lib/arabic";
/* مركز المباراة: بيانات ESPN summary (أحداث، إحصائيات، تشكيلة، مواجهات، ترتيب) */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Side={id:string;name:string;logo?:string};
type Ev={min:string;kind:"goal"|"yc"|"rc"|"sub"|"pen"|"og";side:"home"|"away";who:string;who2?:string};
type Stat={k:string;h:string;a:string;hv:number;av:number};
type P={n:string;j:string;pos:string};
type G={res:string;score:string;opp:string;date:string};

const SOCCER:Record<string,string>={possessionPct:"الاستحواذ %",totalShots:"التسديدات",shotsOnTarget:"على المرمى",wonCorners:"الركنيات",foulsCommitted:"الأخطاء",offsides:"التسلل",yellowCards:"البطاقات الصفراء",redCards:"البطاقات الحمراء",saves:"التصديات",totalPasses:"التمريرات",passPct:"دقة التمرير %",blockedShots:"تسديدات مصدودة",totalTackles:"التدخلات",interceptions:"الاعتراضات"};
const OTHER:Record<string,string>={fieldGoalPct:"التسديد الميداني %",threePointFieldGoalPct:"الثلاثيات %",freeThrowPct:"الرميات الحرة %",totalRebounds:"المرتدات",offensiveRebounds:"مرتدات هجومية",assists:"التمريرات الحاسمة",steals:"الافتكاكات",blocks:"الصدات",turnovers:"الكرات الضائعة",fouls:"الأخطاء",largestLead:"أكبر فارق",
 firstDowns:"الداونات الأولى",totalYards:"مجموع الياردات",netPassingYards:"ياردات التمرير",rushingYards:"ياردات الركض",possessionTime:"وقت الاستحواذ",
 shotsTotal:"التسديدات",powerPlayGoals:"أهداف التفوق العددي",faceoffPercent:"المواجهات %",hits:"الضربات",blockedShots:"تسديدات مصدودة",takeaways:"الافتكاكات",giveaways:"الكرات الضائعة",penaltyMinutes:"دقائق العقوبة",
 runs:"الأشواط",errors:"الأخطاء",homeRuns:"هوم رن",strikeouts:"الإقصاءات",avg:"معدل الضرب"};
const POS:Record<string,string>={G:"حارس",GK:"حارس",D:"دفاع",CD:"دفاع",LB:"ظهير",RB:"ظهير",M:"وسط",DM:"ارتكاز",AM:"صانع",F:"هجوم",CF:"مهاجم",LW:"جناح",RW:"جناح"};
const RES:Record<string,[string,string]>={W:["ف","bg-teal text-bg"],D:["ت","bg-[#4A5273] text-white"],L:["خ","bg-pink text-bg"]};

const num=(s:any)=>{const v=parseFloat(String(s??"").replace(/[^\d.\-]/g,""));return isNaN(v)?0:v};
const L=({children}:{children:React.ReactNode})=><bdi>{children}</bdi>;
const Card=({t,children}:{t:string;children:React.ReactNode})=><section className="panel p-5 min-w-0"><h2 className="font-display text-xl text-white mb-4 flex items-center gap-2"><i aria-hidden className="w-1.5 h-5 rounded-full bg-teal"/>{t}</h2>{children}</section>;

function evKind(t:string):Ev["kind"]|null{t=t.toLowerCase();
 if(t.includes("own goal"))return"og";if(t.includes("penalty")&&t.includes("goal"))return"pen";if(t.includes("goal"))return"goal";
 if(t.includes("red"))return"rc";if(t.includes("yellow"))return"yc";if(t.includes("substitution"))return"sub";return null}
const ICON:Record<Ev["kind"],string>={goal:"⚽",pen:"⚽",og:"⚽",yc:"🟨",rc:"🟥",sub:"🔁"};
const KTXT:Record<Ev["kind"],string>={goal:"هدف",pen:"ضربة جزاء",og:"ضد مرماه",yc:"إنذار",rc:"طرد",sub:"تبديل"};

async function load(id:string){
 const m=/^(soccer|basketball|hockey|football|baseball)-([^:]+):(\d+)$/.exec(id);if(!m)return null;
 const [,sport,slug,eid]=m;
 let j:any;try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${slug}/summary?event=${eid}`,{cache:"no-store"});if(!r.ok)return null;j=await r.json()}catch{return null}
 const comp=j?.header?.competitions?.[0];const cs:any[]=comp?.competitors||[];
 const hc=cs.find(c=>c.homeAway==="home"),ac=cs.find(c=>c.homeAway==="away");if(!hc||!ac)return null;
 const side=(c:any):Side=>({id:String(c.id??c.team?.id),name:c.team?.shortDisplayName||c.team?.displayName||"",logo:c.team?.logos?.[0]?.href||c.team?.logo});
 const home=side(hc),away=side(ac);const sideOf=(tid:any):"home"|"away"=>String(tid)===away.id?"away":"home";
 const soccer=sport==="soccer";

 // أحداث
 const events:Ev[]=[];
 if(soccer)for(const e of (j.keyEvents||[]) as any[]){const k=evKind(e?.type?.text||e?.type?.type||"");if(!k||!e.team)continue;
  const ps=(e.participants||[]).map((p:any)=>p?.athlete?.displayName).filter(Boolean);
  events.push({min:e.clock?.displayValue||"",kind:k,side:sideOf(e.team.id),who:ps[0]||"",who2:ps[1]})}
 // نقاط/قادة لباقي الرياضات
 const scoring:{t:string;side:"home"|"away";txt:string;sc:string}[]=[];
 if(!soccer)for(const s of ((j.scoringPlays||[]) as any[]).slice(-12))scoring.push({t:[s.period?.number?`ش${s.period.number}`:"",s.clock?.displayValue||""].filter(Boolean).join(" "),side:sideOf(s.team?.id),txt:String(s.text||s.type?.text||"").slice(0,90),sc:`${s.homeScore??""}-${s.awayScore??""}`});
 const leaders:{side:"home"|"away";cat:string;who:string;v:string}[]=[];
 if(!soccer)for(const t of (j.leaders||[]) as any[]){const sd=sideOf(t.team?.id);for(const c of ((t.leaders||[]) as any[]).slice(0,3)){const l=c.leaders?.[0];if(l)leaders.push({side:sd,cat:c.displayName||c.name||"",who:l.athlete?.shortName||l.athlete?.displayName||"",v:l.displayValue||""})}}

 // إحصائيات
 const map=soccer?SOCCER:OTHER;const bt:any[]=j.boxscore?.teams||[];
 const th=bt.find(t=>t.homeAway==="home")||bt.find(t=>String(t.team?.id)===home.id),ta=bt.find(t=>t.homeAway==="away")||bt.find(t=>String(t.team?.id)===away.id);
 const stats:Stat[]=[];
 if(th&&ta){const av=new Map<string,any>();for(const s of ta.statistics||[])av.set(s.name,s);
  for(const k of Object.keys(map)){const h=(th.statistics||[]).find((s:any)=>s.name===k),a=av.get(k);if(!h||!a)continue;
   const pf=(x:any)=>{const v=num(x.displayValue);return k.endsWith("Pct")&&v<=1?Math.round(v*100):v};
   const hv=pf(h),avv=pf(a);const pct=k.endsWith("Pct");
   stats.push({k:map[k],h:pct?String(hv):h.displayValue,a:pct?String(avv):a.displayValue,hv,av:avv})}}

 // تشكيلة
 const lineups:{f?:string;p:P[]}[]=[];
 const rs:any[]=j.rosters||[];
 for(const sd of["home","away"]){const r=rs.find(x=>x.homeAway===sd);if(!r){lineups.push({p:[]});continue}
  const p:P[]=((r.roster||[]) as any[]).filter(x=>x.starter).sort((a,b)=>num(a.formationPlace)-num(b.formationPlace)).map(x=>({n:x.athlete?.displayName||"",j:x.jersey||"",pos:x.position?.abbreviation||""}));
  lineups.push({f:r.formation,p})}

 // آخر النتائج
 const formOf=(sd:Side):G[]=>{const t=((j.lastFiveGames||j.boxscore?.form||[]) as any[]).find(x=>String(x.team?.id)===sd.id);
  return((t?.events||[]) as any[]).slice(0,5).map(e=>({res:e.gameResult||"",score:e.score||`${e.homeTeamScore??""}-${e.awayTeamScore??""}`,opp:e.opponent?.abbreviation||e.opponent?.displayName||"",date:e.gameDate||""}))};
 const form={home:formOf(home),away:formOf(away)};
 // المواجهات
 const h2h:G[]=[];const hh:any[]=j.headToHeadGames||[];
 const hRec=hh.find(x=>String(x.team?.id)===home.id)||hh[0];
 for(const e of ((hRec?.events||[]) as any[]).slice(0,5))h2h.push({res:e.gameResult||"",score:e.score||`${e.homeTeamScore??""}-${e.awayTeamScore??""}`,opp:e.atVs==="@"?"خارج":"داخل",date:e.gameDate||""});

 // الترتيب
 type Row={pos:string;name:string;gp:string;pts:string;me:"home"|"away"|null};
 let table:Row[]=[];let tName="";
 for(const g of (j.standings?.groups||[]) as any[]){const en:any[]=g?.standings?.entries||[];
  if(!en.some(e=>String(e.id??e.team?.id)===home.id||String(e.id??e.team?.id)===away.id))continue;tName="الترتيب"+(arLeague(slug)?" · "+arLeague(slug):"");
  const st=(e:any,...ns:string[])=>{for(const n of ns){const s=(e.stats||[]).find((x:any)=>x.name===n||x.abbreviation===n);if(s)return String(s.displayValue??s.value??"")}return""};
  table=en.map((e,i)=>{const tid=String(e.id??e.team?.id);return{pos:st(e,"rank")||String(i+1),name:typeof e.team==="string"?e.team:(e.team?.shortDisplayName||e.team?.displayName||""),gp:st(e,"gamesPlayed","GP"),pts:st(e,"points","PTS","winPercent"),me:tid===home.id?"home":tid===away.id?"away":null}});
  // مقطع حول الفريقين فقط
  const idx=table.map((r,i)=>r.me?i:-1).filter(i=>i>=0);const lo=Math.max(0,Math.min(...idx)-1),hi=Math.min(table.length,Math.max(...idx)+2);
  table=hi-lo<=8?table.slice(lo,hi):table.filter((r,i)=>r.me||idx.some(x=>Math.abs(x-i)===1));break}

 return{soccer,home,away,events,scoring,leaders,stats,lineups,form,h2h,table,tName}}

function Chips({g}:{g:G[]}){return <div className="flex gap-1.5 flex-wrap">{g.map((x,i)=>{const r=RES[x.res]||["–","bg-line text-mute"];
 return <span key={i} title={`${x.opp} ${x.score}`} className={"w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center "+r[1]}>{r[0]}</span>})}</div>}

export default async function MatchCentre({id}:{id:string}){
 const d=await load(id);if(!d)return null;
 const {home,away}=d;const hasLine=d.lineups.some(l=>l.p.length>0);
 return(<div className="flex flex-col gap-6 min-w-0">
  {d.events.length>0&&<Card t="مجريات المباراة"><ol className="flex flex-col gap-2">{d.events.map((e,i)=>
   <li key={i} className={"flex items-center gap-3 text-sm "+(e.side==="away"?"flex-row-reverse text-left":"")}>
    <span className="w-12 flex-none text-center font-display text-amber tabular-nums" dir="ltr">{e.min}</span>
    <span className="flex-none" aria-label={KTXT[e.kind]}>{ICON[e.kind]}</span>
    <span className="min-w-0 truncate text-white"><L>{e.who}</L>{e.kind==="sub"&&e.who2?<span className="text-mute"> ← <L>{e.who2}</L></span>:null}<span className="text-mute text-xs"> · {KTXT[e.kind]}</span></span>
   </li>)}</ol>
   <div className="flex justify-between text-xs text-mute mt-3"><L>{home.name}</L><L>{away.name}</L></div></Card>}

  {(d.scoring.length>0||d.leaders.length>0)&&<Card t="مجريات المباراة">
   {d.leaders.length>0&&<div className="grid grid-cols-2 gap-3 mb-4">{(["home","away"] as const).map(sd=><div key={sd} className="min-w-0">
    <div className={"text-xs mb-2 "+(sd==="home"?"text-violet":"text-pink")}><L>{sd==="home"?home.name:away.name}</L></div>
    {d.leaders.filter(l=>l.side===sd).map((l,i)=><div key={i} className="text-sm mb-1.5 min-w-0"><div className="text-mute text-xs truncate"><L>{l.cat}</L></div><div className="text-white truncate"><L>{l.who}</L> <bdi dir="ltr" className="text-amber tabular-nums">{l.v}</bdi></div></div>)}</div>)}</div>}
   {d.scoring.length>0&&<ol className="flex flex-col gap-2 text-sm">{d.scoring.map((s,i)=><li key={i} className="flex gap-3 items-start">
    <span className="w-14 flex-none text-mute text-xs tabular-nums" dir="ltr">{s.t}</span><span className={"w-1.5 self-stretch rounded flex-none "+(s.side==="home"?"bg-violet":"bg-pink")}/>
    <span className="min-w-0 flex-1 break-words text-white"><L>{s.txt}</L></span><bdi dir="ltr" className="font-display tabular-nums text-amber flex-none">{s.sc}</bdi></li>)}</ol>}</Card>}

  {d.stats.length>0&&<Card t="الإحصائيات">
   <div className="flex justify-between text-sm mb-3"><span className="text-violet font-semibold"><L>{home.name}</L></span><span className="text-pink font-semibold"><L>{away.name}</L></span></div>
   <div className="flex flex-col gap-3">{d.stats.map(s=>{const t=s.hv+s.av||1;const hp=Math.round(s.hv/t*100);const hw=s.hv>s.av,aw=s.av>s.hv;
    return <div key={s.k}><div className="flex justify-between items-baseline text-sm mb-1">
     <bdi dir="ltr" className={"font-display text-lg tabular-nums "+(hw?"text-white":"text-mute")}>{s.h}</bdi><span className="text-mute text-xs">{s.k}</span><bdi dir="ltr" className={"font-display text-lg tabular-nums "+(aw?"text-white":"text-mute")}>{s.a}</bdi></div>
     <div className="flex h-2 rounded-full overflow-hidden gap-[3px] bg-bg"><i style={{width:hp+"%"}} className={"bg-violet "+(hw?"":"opacity-50")}/><i style={{width:(100-hp)+"%"}} className={"bg-pink "+(aw?"":"opacity-50")}/></div></div>})}</div></Card>}

  {hasLine&&<Card t="التشكيلة"><div className="grid grid-cols-2 gap-4">{d.lineups.map((l,i)=><div key={i} className="min-w-0">
   <div className={"flex justify-between items-center text-sm mb-2 "+(i===0?"text-violet":"text-pink")}><span className="font-semibold truncate"><L>{i===0?home.name:away.name}</L></span>{l.f&&<bdi dir="ltr" className="text-amber tabular-nums text-xs">{l.f}</bdi>}</div>
   <ul className="flex flex-col gap-1.5">{l.p.map((p,k)=><li key={k} className="flex items-center gap-2 text-sm min-w-0">
    <span className={"w-7 h-7 flex-none rounded-lg flex items-center justify-center font-display tabular-nums text-bg "+(i===0?"bg-violet":"bg-pink")}>{p.j}</span>
    <span className="truncate text-white min-w-0 flex-1"><L>{p.n}</L></span>{p.pos&&<span className="text-[10px] text-mute flex-none">{POS[p.pos]||p.pos}</span>}</li>)}</ul></div>)}</div></Card>}

  {(d.h2h.length>0||d.form.home.length>0||d.form.away.length>0)&&<Card t="المواجهات السابقة وآخر النتائج">
   {d.h2h.length>0&&<div className="mb-5"><div className="text-xs text-mute mb-2">آخر المواجهات (من منظور <L>{home.name}</L>)</div>
    <ul className="flex flex-col gap-1.5 text-sm">{d.h2h.map((g,i)=>{const r=RES[g.res];return <li key={i} className="flex items-center gap-3">
     <span className={"w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center flex-none "+(r?.[1]||"bg-line text-mute")}>{r?.[0]||"–"}</span>
     <bdi dir="ltr" className="font-display tabular-nums text-white">{g.score}</bdi><span className="text-mute text-xs">{g.opp}</span>
     {g.date&&<span className="text-mute text-xs ms-auto tabular-nums">{new Date(g.date).toLocaleDateString("ar-DZ",{year:"numeric",month:"short",timeZone:"Africa/Algiers"})}</span>}</li>})}</ul></div>}
   <div className="grid grid-cols-2 gap-4">{(["home","away"] as const).map(sd=>d.form[sd].length>0&&<div key={sd} className="min-w-0">
    <div className={"text-sm mb-2 truncate "+(sd==="home"?"text-violet":"text-pink")}><L>{sd==="home"?home.name:away.name}</L></div><Chips g={d.form[sd]}/></div>)}</div></Card>}

  {d.table.length>0&&<Card t="الترتيب">
   {d.tName&&<div className="text-xs text-mute -mt-3 mb-3"><L>{d.tName}</L></div>}
   <table className="w-full text-sm tabular-nums"><thead><tr className="text-mute text-xs"><th className="text-start font-normal w-8">#</th><th className="text-start font-normal">الفريق</th><th className="font-normal w-10">لعب</th><th className="font-normal w-12">نقاط</th></tr></thead>
    <tbody>{d.table.map((r,i)=><tr key={i} className={"border-t border-line "+(r.me==="home"?"text-violet font-semibold":r.me==="away"?"text-pink font-semibold":"text-white")}>
     <td className="py-1.5">{r.pos}</td><td className="py-1.5 max-w-0 truncate"><L>{r.name}</L></td><td className="text-center">{r.gp}</td><td className="text-center font-display">{r.pts}</td></tr>)}</tbody></table></Card>}
 </div>)}
