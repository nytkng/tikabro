import type {Metadata,Viewport} from "next";
import "@fontsource/readex-pro/400.css";import "@fontsource/readex-pro/600.css";import "@fontsource/readex-pro/700.css";import "@fontsource/lalezar/arabic-400.css";import "@fontsource/lalezar/latin-400.css";
import "./globals.css";
import Header from "@/components/Header";
import InstallPrompt from "@/components/InstallPrompt";
export const metadata:Metadata={title:{default:"هدف — الأرينا",template:"%s · هدف"},description:"توقعات رياضية مختومة وشفافة. تحدّى الـ AI وأثبت أنك متوقع حقيقي. للتوقعات فقط، بلا مراهنة.",metadataBase:new URL(process.env.SITE_URL||"https://hadaf.example")};
export const viewport:Viewport={themeColor:"#0B0D14",width:"device-width",initialScale:1};
export default function Root({children}:{children:React.ReactNode}){
  return(<html lang="ar" dir="rtl"><body><Header/><main className="mx-auto max-w-[1320px] px-3 sm:px-6 py-5 pb-20">{children}</main>
  <footer className="border-t border-line text-mute text-sm px-4 sm:px-10 py-8 text-center leading-8">للتوقعات والتسلية فقط. لا مراهنة ولا أموال حقيقية. التوقعات احتمالات وليست وعودا. <a className="underline" href="/legal">الشروط والخصوصية</a></footer><InstallPrompt/></body></html>);
}
