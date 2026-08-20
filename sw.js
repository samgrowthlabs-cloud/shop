const VERSION='shoplab-pwa-v19-instant-navigation';
const SHELL=['/','/index.html','/produto.html','/produtos.html','/busca.html','/categoria.html','/promocoes.html','/novidades.html','/comparar.html','/conta.html','/entrar.html','/offline.html','/manifest.webmanifest','/assets/css/main.css','/assets/img/favicon.svg','/assets/img/shoplab-wordmark.png','/assets/img/pwa-maskable.svg','/assets/js/pwa.js','/assets/js/mobile-enhancements.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(VERSION),cacheKey=new Request(`${url.origin}${url.pathname}`,{method:'GET'}),cached=await cache.match(cacheKey);
      const network=fetch(request).then(async response=>{if(response.ok)await cache.put(cacheKey,response.clone());return response});
      event.waitUntil(network.then(()=>undefined).catch(()=>undefined));
      return cached||network.catch(()=>caches.match('/offline.html'));
    })());
    return;
  }
  if(!/\.(?:css|js|svg|png|webp|jpg|jpeg|gif|woff2?)(?:$|\?)/i.test(url.pathname+url.search))return;
  if(/\.(?:css|js)(?:$|\?)/i.test(url.pathname+url.search)){
    event.respondWith(fetch(request,{cache:'reload'}).then(async response=>{
      if(response.ok){const copy=response.clone();const cache=await caches.open(VERSION);await cache.put(request,copy)}
      return response;
    }).catch(()=>caches.match(request)));
    return;
  }
  const cached=caches.match(request);
  const fresh=fetch(request).then(async response=>{
    if(response.ok){const copy=response.clone();const cache=await caches.open(VERSION);await cache.put(request,copy)}
    return response;
  });
  event.waitUntil(fresh.then(()=>undefined).catch(()=>undefined));
  event.respondWith(cached.then(hit=>hit||fresh).catch(()=>fresh));
});
