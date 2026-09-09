/* 甜老板·私域助手 — PWA Service Worker (v5.1 自动更新版) */
const CACHE = 'tianlaoban-v9-2-20260909';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // 火山方舟 API + 微信 CDN 透传网络，不缓存
  if (url.hostname.includes('volcengine') || url.hostname.includes('ark.cn')) {
    return;
  }
  const req = e.request;
  const isNavigate = req.mode === 'navigate';
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (isNavigate) {
        // 主文档：网络优先 —— 每次打开都拉最新版，装到桌面的用户自动更新，无需重装
        try {
          const resp = await fetch(req);
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch (err) {
          const cached = await cache.match(req);
          if (cached) return cached;
          return cache.match('./index.html');
        }
      }
      // 静态资源：先用缓存（秒开），后台同步新版
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        if (req.method === 'GET' && resp.ok && url.origin === self.location.origin) {
          cache.put(req, resp.clone());
        }
        return resp;
      } catch (err) {
        return cached;
      }
    })()
  );
});
