import Link from "next/link";
import {t,type Lang} from "@/lib/i18n";
export default function TrustLine({lang="ar"}:{lang?:Lang}){
  return <Link href="/verify" className="block text-center text-xs opacity-80 hover:opacity-100 underline-offset-4 hover:underline py-2">🔒 {t(lang,"ledger.trust")}</Link>;
}
