// البيانات المفتوحة: استعلام التوقعات المختومة (بلا أي بيانات مستخدمين) + سجل نسخ النموذج.
import {db} from "./db";
export const LICENSE="CC BY 4.0",ATTRIBUTION="HADAF (هدف)";
export const FIELDS=["match_id","league","kickoff","home","away","p_home","p_draw","p_away","pick","model_version","sealed_at","outcome","hit","brier"] as const;
export type OpenRow={match_id:string;league:string|null;kickoff:string;home:string;away:string;p_home:number;p_draw:number|null;p_away:number;pick:string|null;model_version:string|null;sealed_at:string;outcome:string|null;hit:boolean|null;brier:number|null};
type Raw=Omit<OpenRow,"sealed_at"|"outcome"|"hit"|"brier">&{created_at:string;outcome:string|null;hit:boolean|null;brier:number|null;settled_at:string|null;void:boolean|null};
const s=(x:number|null)=>x==null?null:Math.round((x>1?x/100:x)*1e4)/1e4;
export const isDay=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+"T00:00:00Z").toISOString().slice(0,10)===d;
export const todayDZ=()=>new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Algiers"});
export const addDays=(d:string,n:number)=>new Date(Date.parse(d+"T00:00:00Z")+n*864e5).toISOString().slice(0,10);
// الجزائر UTC+1 بلا توقيت صيفي
const startDZ=(d:string)=>new Date(Date.parse(d+"T00:00:00Z")-36e5).toISOString();
export async function openPredictions(from:string,toIncl:string,limit=1000):Promise<OpenRow[]|null>{
  const q=`predictions?kickoff=gte.${encodeURIComponent(startDZ(from))}&kickoff=lt.${encodeURIComponent(startDZ(addDays(toIncl,1)))}&select=match_id,league,kickoff,home,away,p_home,p_draw,p_away,pick,model_version,created_at,outcome,hit,brier,settled_at,void&order=kickoff.asc,match_id.asc&limit=${limit}`;
  const r=await db<Raw[]>(q).catch(()=>null);if(!r)return null;
  return r.map(x=>{const done=!!x.settled_at&&!x.void&&!!x.outcome;return {match_id:String(x.match_id),league:x.league,kickoff:x.kickoff,home:x.home,away:x.away,p_home:s(x.p_home)!,p_draw:s(x.p_draw),p_away:s(x.p_away)!,pick:x.pick,model_version:x.model_version,sealed_at:x.created_at,
    outcome:done?x.outcome:null,hit:done?x.hit:null,brier:done&&x.brier!=null?Math.round(x.brier*1e4)/1e4:null}});
}
export const csvCell=(v:unknown)=>{if(v==null)return "";const t=String(v);return /[",\n\r]/.test(t)?`"${t.replace(/"/g,'""')}"`:t};

export type Release={version:string;name:string;date:string;status:"current"|"retired"|"planned";summary:string;changes:string[];why:string};
export const RELEASES:Release[]=[
 {version:"next",name:"الفورمة + xG + معايرة لكل دوري",date:"مخطط",status:"planned",summary:"الخطوة الجاية: نزيدو ميزات الفورمة والأهداف المتوقعة (xG)، ونعايرو الاحتمالات لكل دوري وحدو.",
  changes:["ميزات الفورمة: آخر المباريات بوزن أكبر للأقرب","xG وين تكون متوفرة، باش نفرقو بين الحظ والمستوى","معايرة لكل دوري: كي يقول 60% في دوري معين، لازم تصرا 6 من 10 في نفس الدوري"],
  why:"Elo يشوف النتيجة برك. الفورمة وxG يعطيو صورة أدق، والمعايرة تصلح الثقة الزايدة أو الناقصة في كل دوري."},
 {version:"v2-elo-crowd",name:"Elo + حكمة الجمهور",date:"2026-11-27",status:"current",summary:"تقييم Elo يتحسب من النتائج بذاكرة 120 يوم، ويتخلط مع توقعات الجمهور بوزن يتعدل كل ليلة لكل دوري حسب Brier.",
  changes:["Elo لكل فريق من النتائج الحقيقية، والمباريات القديمة من 120 يوم تنسى","وزن الجمهور يتعدل كل ليلة لكل دوري: اللي ينقص Brier أكثر هو اللي يربح","الختم يصرا بين 10 و45 دقيقة قبل البداية، باش يدخل الجمهور ويبقى التوقع قبل الصافرة","يغطي كل الرياضات والدوريات، ماشي غير الكبار"],
  why:"v1 كان يخدم غير في الدوريات الكبار اللي فيها ترتيب. وبيّنت الأرقام بلي الجمهور أحيانا أصدق، فبدل ما نتجاهلوه، خليناه يدخل في الحساب بوزن تحكم فيه النتائج."},
 {version:"v1-dc",name:"Dixon-Coles للدوريات الكبار",date:"قبل 2026-11-27",status:"retired",summary:"نموذج Dixon-Coles (بواسون مصحح للنتائج الصغيرة) للدوريات الكبار اللي فيها جدول ترتيب.",
  changes:["قوة هجوم ودفاع لكل فريق من جدول الترتيب","تصحيح Dixon-Coles لنتائج 0-0 و1-1 و1-0","احتمالات التعادل أصدق من v0"],
  why:"v0 كان يعطي التعادل وزن عشوائي تقريبا. Dixon-Coles معروف بلي يصلح هذا في كرة القدم."},
 {version:"v0-rec-sql",name:"سجل الموسم (SQL)",date:"الإطلاق",status:"retired",summary:"أول نموذج: احتمالات من سجل الفوز/التعادل/الخسارة تاع كل فريق هذا الموسم، محسوبة مباشرة في SQL.",
  changes:["بسيط وسريع، يخدم على أي رياضة فيها سجل","ختم كل توقع قبل البداية من النهار الأول"],
  why:"كنا نحتاجو خط أساس صادق ومختوم من البداية، باش كل نسخة جاية تتقاس عليه."},
];

type RelText=Pick<Release,"name"|"date"|"summary"|"changes"|"why">;
const RELEASES_TR:Record<"fr"|"en",Record<string,RelText>>={
 fr:{
  "next":{name:"Forme + xG + calibration par ligue",date:"Prévu",summary:"Prochaine étape : ajouter la forme et les buts attendus (xG), et calibrer les probabilités ligue par ligue.",
   changes:["Forme : les derniers matchs, avec plus de poids pour les plus récents","xG quand ils sont disponibles, pour distinguer la chance du niveau","Calibration par ligue : quand on dit 60 % dans une ligue, ça doit arriver 6 fois sur 10 dans cette même ligue"],
   why:"Elo ne voit que le résultat. La forme et les xG donnent une image plus précise, et la calibration corrige l'excès ou le manque de confiance dans chaque ligue."},
  "v2-elo-crowd":{name:"Elo + sagesse du public",date:"2026-11-27",summary:"Une note Elo calculée sur les résultats avec une mémoire de 120 jours, mélangée aux pronostics du public avec un poids réajusté chaque nuit, ligue par ligue, selon le Brier.",
   changes:["Elo par équipe à partir des vrais résultats ; les matchs de plus de 120 jours sont oubliés","Le poids du public est réajusté chaque nuit par ligue : celui qui réduit le plus le Brier l'emporte","Le scellement a lieu entre 10 et 45 minutes avant le coup d'envoi, pour laisser le public voter tout en restant avant le coup de sifflet","Couvre tous les sports et toutes les ligues, pas seulement les grandes"],
   why:"La v1 ne fonctionnait que dans les grandes ligues avec un classement. Et les chiffres ont montré que le public est parfois plus juste : au lieu de l'ignorer, nous l'avons intégré au calcul avec un poids fixé par les résultats."},
  "v1-dc":{name:"Dixon-Coles pour les grandes ligues",date:"Avant le 2026-11-27",summary:"Modèle Dixon-Coles (Poisson corrigé pour les petits scores) pour les grandes ligues disposant d'un classement.",
   changes:["Force offensive et défensive de chaque équipe à partir du classement","Correction Dixon-Coles des scores 0-0, 1-1 et 1-0","Probabilités de nul plus justes que la v0"],
   why:"La v0 donnait au nul un poids presque arbitraire. Dixon-Coles est réputé corriger cela au football."},
  "v0-rec-sql":{name:"Bilan de la saison (SQL)",date:"Lancement",summary:"Premier modèle : des probabilités tirées du bilan victoires/nuls/défaites de chaque équipe cette saison, calculées directement en SQL.",
   changes:["Simple et rapide, fonctionne pour tout sport avec un historique","Chaque pronostic scellé avant le coup d'envoi dès le premier jour"],
   why:"Il nous fallait une base honnête et scellée dès le départ, pour y mesurer chaque version suivante."},
 },
 en:{
  "next":{name:"Form + xG + per-league calibration",date:"Planned",summary:"Next step: add form and expected goals (xG) features, and calibrate probabilities for each league separately.",
   changes:["Form features: recent matches, with more weight on the latest","xG where available, to separate luck from quality","Per-league calibration: when we say 60% in a league, it should happen 6 times in 10 in that league"],
   why:"Elo only sees the result. Form and xG give a sharper picture, and calibration fixes over- or under-confidence in each league."},
  "v2-elo-crowd":{name:"Elo + wisdom of the crowd",date:"2026-11-27",summary:"An Elo rating built from results with a 120-day memory, blended with crowd predictions using a weight retuned every night per league based on Brier.",
   changes:["Elo per team from real results; matches older than 120 days are forgotten","Crowd weight retuned nightly per league: whatever lowers Brier most wins","Sealing happens 10 to 45 minutes before kick-off, so the crowd can join while the prediction still lands before the whistle","Covers every sport and league, not just the big ones"],
   why:"v1 only worked in big leagues with a standings table. And the numbers showed the crowd is sometimes more accurate, so instead of ignoring it we let it into the calculation with a weight set by results."},
  "v1-dc":{name:"Dixon-Coles for the big leagues",date:"Before 2026-11-27",summary:"A Dixon-Coles model (Poisson corrected for low scores) for the big leagues with a standings table.",
   changes:["Attack and defence strength per team from the standings","Dixon-Coles correction for 0-0, 1-1 and 1-0 scores","More honest draw probabilities than v0"],
   why:"v0 gave draws an almost arbitrary weight. Dixon-Coles is known to fix that in football."},
  "v0-rec-sql":{name:"Season record (SQL)",date:"Launch",summary:"The first model: probabilities from each team's win/draw/loss record this season, computed directly in SQL.",
   changes:["Simple and fast, works for any sport with a record","Every prediction sealed before kick-off from day one"],
   why:"We needed an honest, sealed baseline from the start, so every later version could be measured against it."},
 },
};
/** ملاحظات الإصدار باللغة المطلوبة (العربية هي الأصل) */
export const releasesFor=(l:"ar"|"fr"|"en"):Release[]=>l==="ar"?RELEASES:RELEASES.map(r=>({...r,...(RELEASES_TR[l][r.version]||{})}));
