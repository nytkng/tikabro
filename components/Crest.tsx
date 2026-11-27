// شعار الفريق من المصدر، وإذا ما كانش نرجعو لحرف ملوّن فوق درع.
const cols=["#8B7CFF","#E879A6","#5EC8B8","#FFB020"];
export default function Crest({name,size=40,logo}:{name:string;size?:number;logo?:string|null}){
  if(logo&&/default-team-logo/i.test(logo))logo=null;
  if(logo)return <span aria-hidden="true" className="crest grid place-items-center flex-none rounded-full" style={{width:size,height:size}}><img src={logo} alt="" width={size} height={size} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="object-contain" style={{width:size*0.82,height:size*0.82}}/></span>;
  const c=cols[[...name].reduce((a,ch)=>a+ch.charCodeAt(0),0)%cols.length];
  return <span aria-hidden="true" data-nosnippet className="inline-flex items-center justify-center rounded-full font-bold flex-none" style={{width:size,height:size,background:`radial-gradient(circle at 30% 25%,${c},${c}99 70%)`,color:"#0B0D14",fontSize:size*0.42,boxShadow:"inset 0 0 0 1px rgba(255,255,255,.18)"}}><span className="select-none" style={{userSelect:"none"}}>{[...name.trim()][0]}</span></span>;
}
