const CACHE='osaka-lany-2026-v21';
const SHELL=['./guide-data.json?v=62','./guides.js?v=62','./','./index.html','./trip-data.json','./places.json?v=62','./mobile.js?v=62','./install.js','./reading.js?v=62','./sync-core.js','./private-sync.js','./sync-config.json','./mobile.css?v=62','./manifest.webmanifest','./icon.svg','./apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('osaka-lany-2026-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(url.pathname.endsWith('/trip-data.json')){
    event.respondWith(fetch(event.request).then(async response=>{
      if(response.ok){const cache=await caches.open(CACHE);await cache.put('./trip-data.json',response.clone());}
      return response;
    }).catch(()=>caches.open(CACHE).then(cache=>cache.match('./trip-data.json'))));return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(async response=>{
      if(!response.ok)throw Error('HTTP '+response.status);
      const cache=await caches.open(CACHE);await cache.put('./index.html',response.clone());return response;
    }).catch(()=>caches.open(CACHE).then(cache=>cache.match('./index.html'))));return;
  }
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request)).then(cached=>cached||fetch(event.request)));
});
