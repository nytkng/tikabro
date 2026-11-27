// شعار الفريق من المصدر، وإذا ما كانش نرجعو لحرف ملوّن.
const cols=["#8B7CFF","#E879A6","#5EC8B8","#FFB020"];
export default function Crest({name,size=40,logo}:{name:string;size?:number;logo?:string|null}){
  if(logo)return <img src={logo.replace("/500/","/500/")} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" className="flex-none object-contain" style={{width:size,height:size}}/>;
  const c=cols[[...name].reduce((a,ch)=>a+ch.charCodeAt(0),0)%cols.length];
  return <span aria-hidden className="inline-flex items-center justify-center rounded-full font-bold text-bg flex-none" style={{width:size,height:size,background:c,fontSize:size*0.42}}>{[...name.trim()][0]}</span>;
}
