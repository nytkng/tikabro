"use client";
// بطاقة التوقع: ترسم في المتصفح (يدعم العربية كاملة) وتتشارك بضغطة في TikTok/Instagram/واتساب.
import {useState} from "react";
export default function ShareCard({nick,home,away,mine,ai,aiPct,kickoff,url}:{nick:string;home:string;away:string;mine:string;ai:string|null;aiPct:number|null;kickoff:string;url:string}){
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  async function draw():Promise<Blob>{
    await document.fonts.ready;
    const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d")!;
    const F="'Readex Pro', system-ui, sans-serif";
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#151833");bg.addColorStop(1,"#0B0D17");g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.direction="rtl";g.textAlign="right";
    g.fillStyle="#fff";g.font=`700 96px ${F}`;g.fillText("هدف",W-80,170);g.fillStyle="#8B7CFF";g.fillText(".",W-80-g.measureText("هدف").width-6,170);
    g.fillStyle="#9AA0BC";g.font=`400 34px ${F}`;g.fillText(new Date(kickoff).toLocaleDateString("ar-DZ",{weekday:"long",day:"numeric",month:"long",timeZone:"Africa/Algiers"}),W-80,250);
    const fit=(t:string,max:number,size:number)=>{let s=size;do{g.font=`700 ${s}px ${F}`;s-=4}while(g.measureText(t).width>max&&s>30);return t};
    g.fillStyle="#fff";g.textAlign="center";fit(home,W-160,80);g.fillText(home,W/2,420);
    g.fillStyle="#9AA0BC";g.font=`400 40px ${F}`;g.fillText("ضد",W/2,500);
    g.fillStyle="#fff";fit(away,W-160,80);g.fillText(away,W/2,600);
    const box=(y:number,label:string,val:string,color:string)=>{g.fillStyle="#1A1E38";g.beginPath();g.roundRect(80,y,W-160,190,32);g.fill();g.strokeStyle=color;g.lineWidth=4;g.stroke();
      g.textAlign="right";g.fillStyle="#9AA0BC";g.font=`400 34px ${F}`;g.fillText(label,W-130,y+65);g.fillStyle="#fff";fit(val,W-260,64);g.fillText(val,W-130,y+150)};
    box(690,`توقع ${nick}`,mine,"#F27AB6");
    box(910,"توقع الـ AI",ai?(aiPct?`${ai} · ${aiPct}%`:ai):"—","#8B7CFF");
    g.textAlign="center";g.fillStyle="#F5B748";g.font=`600 38px ${F}`;g.fillText("مختوم قبل البداية · شكون يصيب؟",W/2,1190);
    g.fillStyle="#9AA0BC";g.font=`400 32px ${F}`;g.direction="ltr";g.fillText(url.replace(/^https?:\/\//,""),W/2,1270);
    return await new Promise<Blob>((ok,no)=>c.toBlob(b=>b?ok(b):no(),"image/png"));
  }
  async function go(){
    setBusy(true);setMsg("");
    try{
      const blob=await draw();const file=new File([blob],"hadaf.png",{type:"image/png"});
      const nav:any=navigator;
      if(nav.canShare?.({files:[file]})){await nav.share({files:[file],text:`توقعي: ${mine}. وأنت؟ ${url}`})}
      else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="hadaf.png";a.click();setMsg("تحمّلت الصورة ✓")}
    }catch(e:any){if(e?.name!=="AbortError")setMsg("تعذّر إنشاء الصورة.")}
    setBusy(false);
  }
  return(<div className="mt-4"><button onClick={go} disabled={busy} className="btn w-full min-h-12 rounded-xl border border-pink/60 text-white font-semibold hover:bg-pink/10 disabled:opacity-50">{busy?"لحظة...":"شارك توقعك (صورة)"}</button>{msg&&<p role="status" className="text-sm mt-2 text-mute">{msg}</p>}</div>);
}
