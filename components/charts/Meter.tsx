// شريط Brier أفقي: كل ما قصر كل ما كان أحسن. المرجع 0.667.
export default function Meter({label,value,color}:{label:string;value:number;color:string}){
  const w=Math.min(100,value/0.8*100);
  return(<div><div className="flex justify-between text-sm"><span className="text-mute">{label}</span><span dir="ltr" className="tabular-nums text-white">{value.toFixed(3)}</span></div>
    <div className="relative h-2.5 rounded-full bg-line mt-1.5" role="meter" aria-valuemin={0} aria-valuemax={0.8} aria-valuenow={value} aria-label={label}>
      <div className="absolute inset-y-0 right-0 rounded-full" style={{width:w+"%",background:color}}/>
      <div className="absolute -inset-y-1 w-px bg-mute" style={{right:(0.667/0.8*100)+"%"}} title="المرجع 0.667"/></div></div>);
}
