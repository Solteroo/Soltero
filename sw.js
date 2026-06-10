const SW_VERSION = "soltero-v1.5.3";

const CACHE_STATIC = SW_VERSION + "-static";
const CACHE_PAGES  = SW_VERSION + "-pages";
const CACHE_IMAGES = SW_VERSION + "-images";

const OFFLINE_KEY = "offline-page";

// ✔ FIX: safe paths (GitHub Pages friendly)
const BASE = self.location.pathname.replace(/sw\.js$/, "");

const PRECACHE_URLS = [
  BASE + "index.html",
  BASE + "projects.html",
  BASE + "services.html",
  BASE + "contact.html",
  BASE + "about.html",
  BASE + "soltero.css",
  BASE + "app.js",
  BASE + "i18n.js",
  BASE + "projects.js"
];

// Offline HTML (FIXED)
const OFFLINE_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline</title>
<style>
body{margin:0;background:#080705;color:#fff;
display:flex;align-items:center;justify-content:center;
height:100vh;font-family:system-ui;text-align:center}
</style>
</head>
<body>
<h2>Offline Mode</h2>
<p>Please check your internet connection</p>
</body>
</html>`;

// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async cache => {
      await Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(() => {})
        )
      );

      await cache.put(
        OFFLINE_KEY,
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html" }
        })
      );
    })
  );

  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", event => {
  const KEEP = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES];

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (!KEEP.includes(k)) return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  if (/\.(js|css)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  event.respondWith(networkFallback(request));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return offlineHTML();
  }
}

async function networkFirstHTML(request) {
  const cache = await caches.open(CACHE_PAGES);

  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request)) || offlineHTML();
  }
}

async function networkFallback(request) {
  try {
    return await fetch(request);
  } catch {
    return offlineHTML();
  }
}

function offlineHTML() {
  return caches.match(OFFLINE_KEY);
}
