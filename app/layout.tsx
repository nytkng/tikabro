import type {Metadata,Viewport} from "next";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";import "@fontsource/ibm-plex-sans-arabic/latin-400.css";import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";import "@fontsource/ibm-plex-sans-arabic/latin-500.css";import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";import "@fontsource/ibm-plex-sans-arabic/latin-600.css";import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";import "@fontsource/ibm-plex-sans-arabic/latin-700.css";import "@fontsource/lalezar/arabic-400.css";import "@fontsource/lalezar/latin-400.css";
import "./globals.css";
import Header from "@/components/Header";
import InstallPrompt from "@/components/InstallPrompt";
import {getLang,getLite} from "@/lib/lang";
import {t,dirOf} from "@/lib/i18n";
export const metadata:Metadata={title:{default:"هدف — الأرينا",template:"%s · هدف"},description:"توقعات رياضية مختومة وشفافة. تحدّى الـ AI وأثبت أنك متوقع حقيقي. للتوقعات فقط، بلا مراهنة.",metadataBase:new URL(process.env.SITE_URL||"https://tikabro.thenytkng.workers.dev")};
export const viewport:Viewport={themeColor:"#0B0E13",width:"device-width",initialScale:1};
export default async function Root({children}:{children:React.ReactNode}){
  const lang=await getLang(),lite=await getLite();
  return(<html lang={lang} dir={dirOf(lang)} className={lite?"lite":undefined}><body><Header/><main className="mx-auto max-w-[1320px] px-3 sm:px-6 py-5 pb-20">{children}</main>
  <footer className="border-t border-line text-mute text-sm px-4 sm:px-10 py-8 text-center leading-8">{t(lang,"footer.note")} <a className="underline" href="/legal">{t(lang,"footer.legal")}</a><span className="block text-xs mt-2 space-x-3 space-x-reverse"><a className="underline" href="/verify">{t(lang,"f.verify")}</a><a className="underline" href="/data">{t(lang,"f.data")}</a><a className="underline" href="/changelog">{t(lang,"f.changelog")}</a><a className="underline" href="/learn">{t(lang,"f.learn")}</a><a className="underline" href="/creator">{t(lang,"f.creator")}</a><a className="underline text-white" href={`/api/lite?on=${lite?0:1}`} rel="nofollow">{t(lang,lite?"lite.off":"lite.on")}</a></span></footer><InstallPrompt/></body></html>);
}
