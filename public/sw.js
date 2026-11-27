// عامل خدمة بسيط لهدف
const V="hadaf-v2",SHELL=["/","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png"];
const OFFLINE='<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>هدف</title><body style="background:#0B0D14;color:#fff;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center"><div><h1 style="color:#F5B301">ما كاينش انترنت</h1><p>تحقق من الاتصال وعاود المحاولة.</p></div></body></html>';
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const u=new URL(req.url);if(u.origin!==location.origin||u.pathname.startsWith("/api/"))return;
  if(u.pathname.startsWith("/_next/static/")||u.pathname.startsWith("/icons/")){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(req,cp))}return r})));return;
  }
  if(req.mode==="navigate"){
    e.respondWith(fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(req,cp))}return r})
      .catch(()=>caches.match(req).then(hit=>hit||new Response(OFFLINE,{headers:{"Content-Type":"text/html; charset=utf-8"}}))));
  }
});
// إشعارات: الدقة جات فارغة، نجبدو الرسائل من الموقع
self.addEventListener("push",e=>{e.waitUntil(self.registration.pushManager.getSubscription().then(s=>s?fetch("/api/push/pull",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:s.endpoint})}).then(r=>r.json()):{items:[]}).then(j=>{const it=(j&&j.items)||[];if(!it.length)return self.registration.showNotification("هدف",{body:"تحديث جديد",icon:"/icons/icon-192.png"});return Promise.all(it.map(x=>self.registration.showNotification(x.title,{body:x.body,icon:"/icons/icon-192.png",badge:"/icons/icon-192.png",tag:x.url,renotify:true,data:{url:x.url}})))}).catch(()=>{}))});
self.addEventListener("notificationclick",e=>{e.notification.close();const u=(e.notification.data&&e.notification.data.url)||"/";e.waitUntil(clients.matchAll({type:"window"}).then(cs=>{for(const c of cs){if("focus" in c){c.navigate(u);return c.focus()}}return clients.openWindow(u)}))});
