// مخطط المعايرة: واش قال الـ AI (بنفسجي فاتح) مقابل واش صرا فعلا (بنفسجي معبّى). SVG خالص.
export type Bin={said:number;happened:number;n:number};
export default function Calibration({bins}:{bins:Bin[]}){
  const W=320,H=160,pad=18,bw=(W-pad)/10;
  return(<figure dir="ltr">
    <svg viewBox={`0 0 ${W} ${H+18}`} className="w-full h-auto" role="img" aria-label="مخطط المعايرة: الاحتمال المقول مقابل النسبة الحقيقية">
      {[0,.5,1].map(t=><g key={t}><line x1={pad} x2={W} y1={H-t*H} y2={H-t*H} stroke="#1E2436"/><text x={0} y={H-t*H+3} fontSize="8" fill="#9AA1B5">{t*100}</text></g>)}
      {bins.map((b,i)=>{const x=pad+i*bw+2,w=(bw-6)/2,s=b.n?b.said:0,h=b.n?b.happened:0;return <g key={i}>
        <title>{`${i*10}–${i*10+10}%: قال ${Math.round(s*100)}% · صرا ${Math.round(h*100)}% · ${b.n} احتمال`}</title>
        <rect x={x} y={H-s*H} width={w} height={s*H} rx="2" fill="none" stroke="#8B7CFF" strokeWidth="1.2"/>
        <rect x={x+w+2} y={H-h*H} width={w} height={h*H} rx="2" fill="#8B7CFF" opacity={b.n<20?.45:1}/>
        <text x={x+w} y={H+12} fontSize="8" fill="#9AA1B5" textAnchor="middle">{i*10}</text></g>})}
    </svg>
    <figcaption className="flex gap-4 text-xs text-mute mt-2 justify-end" dir="rtl">
      <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm border border-violet inline-block"/>واش قال</span>
      <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-violet inline-block"/>واش صرا</span>
    </figcaption>
  </figure>);
}
