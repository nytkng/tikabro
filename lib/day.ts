import {fetchDay} from "./espn";
import {sample} from "./sample";
import {dayFromDB} from "./feed";
export const isDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s));
export async function getDay(date:string){
  const fromDb=await dayFromDB(date).catch(()=>null);
  if(fromDb)return fromDb;
  const m=await fetchDay(date);
  return m.length?m:sample(date);
}
