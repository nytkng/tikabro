import type {Metadata,Viewport} from "next";
import "@fontsource/readex-pro/400.css";import "@fontsource/readex-pro/600.css";import "@fontsource/readex-pro/700.css";import "@fontsource/lalezar/arabic-400.css";import "@fontsource/lalezar/latin-400.css";
import "./globals.css";
import Header from "@/components/Header";
import InstallPrompt from "@/components/InstallPrompt";
import {getLang} from "@/lib/lang";
import {t,dirOf} from "@/lib/i18n";
export const metadata:Metadata={title:{default:"هدف — الأرينا",template:"%s · هدف"},description:"توقعات رياضية مختومة وشفافة. تحدّى الـ AI وأثبت أنك متوقع حقيقي. للتوقعات فقط، بلا مراهنة.",metadataBase:new URL(process.env.SITE_URL||"https://tikabro.thenytkng.workers.dev")};
export const viewport:Viewport={themeColor:"#0B0D14",width:"device-width",initialScale:1};
export default async function Root({children}:{children:React.ReactNode}){
  const lang=await getLang();
  return(<html lang={lang} dir={dirOf(lang)}><body><Header/><main className="mx-auto max-w-[1320px] px-3 sm:px-6 py-5 pb-20">{children}</main>
  <footer className="border-t border-line text-mute text-sm px-4 sm:px-10 py-8 text-center leading-8">{t(lang,"footer.note")} <a className="underline" href="/legal">{t(lang,"footer.legal")}</a><span className="block text-xs mt-2 space-x-3 space-x-reverse"><a className="underline" href="/verify">التحقق من الأختام</a><a className="underline" href="/data">البيانات المفتوحة</a><a className="underline" href="/changelog">سجل تطوير الـ AI</a><a className="underline" href="/learn">علاش غلط الـ AI</a><a className="underline" href="/creator">للبث</a></span></footer><InstallPrompt/></body></html>);
}
