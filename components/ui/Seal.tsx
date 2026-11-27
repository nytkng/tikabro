// الختم الكهرماني: علامة هدف. يرمز للتوقع المختوم قبل الصافرة.
export default function Seal({children,size=56,className=""}:{children:React.ReactNode;size?:number;className?:string}){
  return <span aria-hidden className={"seal-mark grid place-items-center rounded-full text-center font-display leading-none "+className} style={{width:size,height:size,fontSize:size*0.26}}>{children}</span>;
}
