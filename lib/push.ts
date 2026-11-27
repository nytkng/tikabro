// Web Push مجاني: نبعثو دقة فارغة موقّعة بـ VAPID (ES256 عبر WebCrypto)، والهاتف يجبد الرسالة من /api/push/pull.
export const VAPID_PUBLIC="BDAhSg8R05kckyahmx--FrDyWX54vUPEkUNCC1TI3opk1Hdh6oArK1fnkDDc8y5DZjcEts_SHnZiaMOEDX2bkLg";
const X="MCFKDxHTmRyTJqGbH74WsPJZfni9Q8SRQ0ILVMjeimQ",Y="1Hdh6oArK1fnkDDc8y5DZjcEts_SHnZiaMOEDX2bkLg";
const b64u=(b:ArrayBuffer|Uint8Array)=>{const a=b instanceof Uint8Array?b:new Uint8Array(b);let s="";for(const c of a)s+=String.fromCharCode(c);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
let key:CryptoKey|null=null;
async function priv(){if(key)return key;const d=process.env.VAPID_PRIVATE?.trim();if(!d)return null;
  key=await crypto.subtle.importKey("jwk",{kty:"EC",crv:"P-256",x:X,y:Y,d,ext:true},{name:"ECDSA",namedCurve:"P-256"},false,["sign"]);return key}
export async function ping(endpoint:string):Promise<number>{
  const k=await priv();if(!k)return 0;
  const aud=new URL(endpoint).origin,enc=new TextEncoder();
  const h=b64u(enc.encode(JSON.stringify({typ:"JWT",alg:"ES256"}))),p=b64u(enc.encode(JSON.stringify({aud,exp:Math.floor(Date.now()/1000)+12*3600,sub:"mailto:ti9ahamza@gmail.com"})));
  const sig=await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},k,enc.encode(h+"."+p));
  const r=await fetch(endpoint,{method:"POST",headers:{TTL:"3600",Urgency:"high",Authorization:`vapid t=${h}.${p}.${b64u(sig)}, k=${VAPID_PUBLIC}`,"Content-Length":"0"}}).catch(()=>null);
  return r?r.status:0;
}
