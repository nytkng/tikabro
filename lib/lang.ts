// لغة الطلب الحالي (سيرفر فقط): الكوكي أولا، وإلا Accept-Language، وإلا العربية.
import {cookies,headers} from "next/headers";
import {LANG_COOKIE,isLang,type Lang} from "./i18n";
export async function getLang():Promise<Lang>{
  const c=(await cookies()).get(LANG_COOKIE)?.value;
  if(isLang(c))return c;
  const al=((await headers()).get("accept-language")||"").trim().toLowerCase().slice(0,2);
  return al==="fr"?"fr":al==="en"?"en":"ar";
}

// وضع خفيف: الكوكي، وإلا Save-Data من المتصفح.
export async function getLite():Promise<boolean>{
  const c=(await cookies()).get("hadaf_lite")?.value;if(c==="1")return true;if(c==="0")return false;
  return ((await headers()).get("save-data")||"").toLowerCase()==="on";
}
