// لغة طلب API: كوكي hadaf_lang من الهيدرز، وإلا Accept-Language، وإلا العربية (نفس منطق getLang).
import {LANG_COOKIE,isLang,type Lang} from "./i18n";
export function langOf(req:Request):Lang{
  const c=new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=([^;]+)`).exec(req.headers.get("cookie")||"")?.[1];
  if(isLang(c))return c;
  const al=(req.headers.get("accept-language")||"").trim().toLowerCase().slice(0,2);
  return al==="fr"?"fr":al==="en"?"en":"ar";
}
