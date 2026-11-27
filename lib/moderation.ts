// فلترة بسيطة للتعليقات: روابط، أرقام، إيميلات، سب، رهان.
const norm=(s:string)=>s.toLowerCase().normalize("NFKC").replace(/[ً-ٟـ]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي");
const LINK=/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|me|dz|fr|xyz|ly|gg|co|app|link|bet|tk|ru)\b|t\.me|wa\.me|bit\.ly)/i;
const EMAIL=/[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE=/(\+?\d[\d\s.\-]{7,}\d)|([٠-٩][٠-٩\s.\-]{7,}[٠-٩])/;
const BAD=["1xbet","melbet","betwinner","bet365","linebet","paris sportif","parieur","pari ","مراهنه","مراهنات","رهان","رهانات","بيت وينر",
 "fuck","shit","bitch","asshole","motherfucker","putain","salope","connard","encule","enculé","pute","merde","nique","ntm",
 "زمل","قحبه","كلب","حمار","نيك","زبي","طحان","شرموط","منيوك","خرا"];
export function checkComment(raw:string):string|null{
  const s=raw.trim();
  if(!s||s.length>280)return "التعليق لازم يكون بين 1 و 280 حرف.";
  if(LINK.test(s))return "ممنوع الروابط في النقاش.";
  if(EMAIL.test(s))return "ممنوع الإيميلات في النقاش.";
  if(PHONE.test(s))return "ممنوع أرقام الهاتف في النقاش.";
  const n=" "+norm(s).replace(/[^\p{L}\p{N}]+/gu," ")+" ";
  if(BAD.some(w=>{const k=norm(w).trim();return k.length<=4?n.includes(" "+k+" "):n.includes(k)}))return "احترم الناس: بلا سب وبلا رهان.";
  return null;
}
