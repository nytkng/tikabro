// ينقّي رابط Supabase: يحذف المسافات والسلاش و/rest/v1 ويُبقي العنوان الأساسي فقط.
export function supaOrigin(raw?:string){
  if(!raw)return null;
  let s=raw.trim().replace(/^["']|["']$/g,"");
  if(!/^https?:\/\//i.test(s))s="https://"+s;
  try{return new URL(s).origin;}catch{return null;}
}
