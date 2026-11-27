const cols=["#8B7CFF","#E879A6","#5EC8B8","#FFB020"];
export default function Crest({name,size=40}:{name:string;size?:number}){
  const c=cols[[...name].reduce((a,ch)=>a+ch.charCodeAt(0),0)%cols.length];
  return <span aria-hidden className="inline-flex items-center justify-center rounded-full font-bold text-bg flex-none" style={{width:size,height:size,background:c,fontSize:size*0.42}}>{[...name.trim()][0]}</span>;
}
