// الدخول بجوجل: نطلب openid برك (بلا إيميل ولا اسم). نخزن بصمة مشفرة لمعرّف جوجل، ماشي المعرّف نفسو.
import {sha256} from "./auth";
export const GS="hadaf_gs",GP="hadaf_gp";
export const gOpts={httpOnly:true,secure:true,sameSite:"lax" as const,path:"/",maxAge:600};
export const googleOn=()=>!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET);
export const googleHash=async(sub:string)=>sha256("hadaf-google:"+sub+":"+(process.env.PLAYER_SECRET||process.env.SUPABASE_SERVICE_KEY||""));
export const redirectUri=(req:Request)=>new URL("/api/auth/google/callback",req.url).toString();
