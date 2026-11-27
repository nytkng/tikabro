// CSP بـ nonce: كل طلب ياخذ رقم عشوائي، وغير السكريبتات اللي تحمله تخدم. هكذا ما يقدرش حد يحقن JavaScript.
import {NextResponse,type NextRequest} from "next/server";
export function middleware(req:NextRequest){
  const nonce=btoa(crypto.randomUUID());
  const csp=[`default-src 'self'`,`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,`frame-src https://challenges.cloudflare.com`,`connect-src 'self' https://challenges.cloudflare.com`,`img-src 'self' data: https:`,`style-src 'self' 'unsafe-inline'`,`font-src 'self' data:`,`worker-src 'self'`,`manifest-src 'self'`,`object-src 'none'`,`base-uri 'self'`,`form-action 'self'`,`frame-ancestors 'none'`,`upgrade-insecure-requests`].join("; ");
  const h=new Headers(req.headers);h.set("x-nonce",nonce);h.set("Content-Security-Policy",csp);
  const res=NextResponse.next({request:{headers:h}});res.headers.set("Content-Security-Policy",csp);return res;
}
export const config={matcher:[{source:"/((?!api|_next/static|_next/image|icons|sw.js|manifest|favicon).*)",missing:[{type:"header",key:"next-router-prefetch"},{type:"header",key:"purpose",value:"prefetch"}]}]};
