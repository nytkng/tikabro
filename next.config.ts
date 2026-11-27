import type { NextConfig } from "next";
const security=[
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"X-Frame-Options",value:"DENY"},
 {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
 {key:"Strict-Transport-Security",value:"max-age=63072000; includeSubDomains"},
 {key:"Content-Security-Policy",value:"default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
];
const config: NextConfig = { poweredByHeader:false, async headers(){ return [{source:"/(.*)",headers:security}]; } };
export default config;
