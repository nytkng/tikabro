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
