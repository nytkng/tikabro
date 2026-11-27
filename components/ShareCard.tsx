"use client";
// بطاقة التوقع: ترسم في المتصفح (يدعم العربية كاملة) وتتشارك بضغطة في TikTok/Instagram/واتساب.
import {useState} from "react";
import {t,locOf,type Lang} from "@/lib/i18n";
export default function ShareCard({nick,home,away,mine,ai,aiPct,kickoff,url,lang="ar"}:{nick:string;home:string;away:string;mine:string;ai:string|null;aiPct:number|null;kickoff:string;url:string;lang?:Lang}){
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  async function draw():Promise<Blob>{
    await document.fonts.ready;
    const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d")!;
    const F="'IBM Plex Sans Arabic', system-ui, sans-serif";
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#151833");bg.addColorStop(1,"#0B0D17");g.fillStyle=bg;g.fillRect(0,0,W,H);
    const rtl=lang==="ar",S:"right"|"left"=rtl?"right":"left",X=rtl?W-80:80,XB=rtl?W-130:130,brand=t(lang,"brand");
    g.direction=rtl?"rtl":"ltr";g.textAlign=S;
    g.fillStyle="#fff";g.font=`700 96px ${F}`;g.fillText(brand,X,170);g.fillStyle="#8B7CFF";g.fillText(".",rtl?X-g.measureText(brand).width-6:X+g.measureText(brand).width+6,170);
    g.fillStyle="#9AA0BC";g.font=`400 34px ${F}`;g.fillText(new Date(kickoff).toLocaleDateString(locOf(lang),{weekday:"long",day:"numeric",month:"long",timeZone:"Africa/Algiers"}),X,250);
    const fit=(t:string,max:number,size:number)=>{let s=size;do{g.font=`700 ${s}px ${F}`;s-=4}while(g.measureText(t).width>max&&s>30);return t};
    g.fillStyle="#fff";g.textAlign="center";fit(home,W-160,80);g.fillText(home,W/2,420);
    g.fillStyle="#9AA0BC";g.font=`400 40px ${F}`;g.fillText(t(lang,"s.vs"),W/2,500);
    g.fillStyle="#fff";fit(away,W-160,80);g.fillText(away,W/2,600);
    const box=(y:number,label:string,val:string,color:string)=>{g.fillStyle="#1A1E38";g.beginPath();g.roundRect(80,y,W-160,190,32);g.fill();g.strokeStyle=color;g.lineWidth=4;g.stroke();
      g.textAlign=S;g.fillStyle="#9AA0BC";g.font=`400 34px ${F}`;g.fillText(label,XB,y+65);g.fillStyle="#fff";fit(val,W-260,64);g.fillText(val,XB,y+150)};
    box(690,t(lang,"s.pick_of",{n:nick}),mine,"#F27AB6");
    box(910,t(lang,"s.ai"),ai?(aiPct?`${ai} · ${aiPct}%`:ai):"—","#8B7CFF");
    g.textAlign="center";g.fillStyle="#F5B748";g.font=`600 38px ${F}`;g.fillText(t(lang,"s.tag"),W/2,1190);
    g.fillStyle="#9AA0BC";g.font=`400 32px ${F}`;g.direction="ltr";g.fillText(url.replace(/^https?:\/\//,""),W/2,1270);
    return await new Promise<Blob>((ok,no)=>c.toBlob(b=>b?ok(b):no(),"image/png"));
  }
  async function go(){
    setBusy(true);setMsg("");
    try{
      const blob=await draw();const file=new File([blob],"hadaf.png",{type:"image/png"});
      const nav:any=navigator;
      if(nav.canShare?.({files:[file]})){await nav.share({files:[file],text:t(lang,"s.text",{x:mine,u:url})})}
      else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="hadaf.png";a.click();setMsg(t(lang,"s.saved"))}
    }catch(e:any){if(e?.name!=="AbortError")setMsg(t(lang,"s.fail"))}
    setBusy(false);
  }
  return(<div className="mt-4"><button onClick={go} disabled={busy} className="btn w-full min-h-12 rounded-xl border border-pink/60 text-white font-semibold hover:bg-pink/10 disabled:opacity-50">{busy?t(lang,"busy"):t(lang,"s.btn")}</button>{msg&&<p role="status" className="text-sm mt-2 text-mute">{msg}</p>}</div>);
}
