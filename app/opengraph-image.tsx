import {ImageResponse} from "next/og";
export const alt="HADAF";
export const size={width:1200,height:630};
export const contentType="image/png";
// صورة ثابتة: لاتيني فقط (تشكيل العربية في satori غير موثوق)
export default function OG(){
  return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",background:"linear-gradient(135deg,#0B0D14 0%,#141a2e 60%,#0B0D14 100%)",color:"#fff"}}>
    <div style={{display:"flex",gap:24,marginBottom:40}}>
      <div style={{width:90,height:90,borderRadius:45,border:"10px solid #F5B942"}}/>
      <div style={{width:90,height:90,borderRadius:45,background:"#22d3a6"}}/>
      <div style={{width:90,height:90,borderRadius:45,border:"10px solid #6c7bff"}}/>
    </div>
    <div style={{fontSize:170,fontWeight:800,letterSpacing:24,display:"flex"}}>HADAF</div>
    <div style={{width:420,height:10,borderRadius:5,background:"#F5B942",marginTop:24,display:"flex"}}/>
  </div>,size);
}
