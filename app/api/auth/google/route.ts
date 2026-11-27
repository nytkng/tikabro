export const dynamic="force-dynamic";
import {NextResponse} from "next/server";
import {GS,gOpts,googleOn,redirectUri} from "@/lib/google";
export async function GET(req:Request){
  if(!googleOn())return NextResponse.redirect(new URL("/login?g=off",req.url));
  const state=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,"0")).join("");
  const u=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,redirect_uri:redirectUri(req),response_type:"code",scope:"openid",state,prompt:"select_account"}).toString();
  const res=NextResponse.redirect(u);res.cookies.set(GS,state,gOpts);return res;
}
