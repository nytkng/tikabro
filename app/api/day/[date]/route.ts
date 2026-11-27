import {getDay,isDate} from "@/lib/day";
export async function GET(_:Request,{params}:{params:Promise<{date:string}>}){
  const {date}=await params;
  if(!isDate(date))return Response.json({error:"bad_date"},{status:400});
  const matches=await getDay(date);
  return Response.json({date,matches},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=300"}});
}
