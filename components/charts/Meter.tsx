// شريط Brier أفقي: كل ما قصر كل ما كان أحسن. المرجع 0.667.
import {t,type Lang} from "@/lib/i18n";
export default function Meter({label,value,color,lang="ar"}:{label:string;value:number;color:string;lang?:Lang}){
  const w=Math.min(100,value/0.8*100);
  return(<div><div className="flex justify-between text-sm"><span className="text-mute">{label}</span><span dir="ltr" className="tabular-nums text-white">{value.toFixed(3)}</span></div>
    <div className="relative h-2.5 rounded-full bg-line mt-1.5" role="meter" aria-valuemin={0} aria-valuemax={0.8} aria-valuenow={value} aria-label={label}>
      <div className="absolute inset-y-0 start-0 rounded-full" style={{width:w+"%",background:color}}/>
      <div className="absolute -inset-y-1 w-px bg-mute" style={{insetInlineStart:(0.667/0.8*100)+"%"}} title={t(lang,"ai.ref")}/></div></div>);
}
