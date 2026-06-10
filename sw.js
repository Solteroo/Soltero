// ===============================
//  SOLTERO PWA SERVICE WORKER
//  Production Ready v1
// ===============================

const SW_VERSION = "soltero-v1.5.4";

// CACHE NAMES
const CACHE_STATIC = `${SW_VERSION}-static`;
const CACHE_PAGES  = `${SW_VERSION}-pages`;
const CACHE_IMAGES = `${SW_VERSION}-images`;

const OFFLINE_KEY = "offline-page";

// ✔ SAFE BASE (GitHub Pages safe)
const BASE = self.registration.scope;

// ===============================
// FILES TO CACHE
// ===============================
const PRECACHE_URLS = [
  BASE,
  BASE + "index.html",
  BASE + "projects.html",
  BASE + "services.html",
  BASE + "contact.html",
  BASE + "about.html",

  BASE + "soltero.css",
  BASE + "app.js",
  BASE + "i18n.js",
  BASE + "projects.js",
  BASE + "pwa.js"
];

// ===============================
// OFFLINE PAGE
// ===============================
const OFFLINE_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline</title>
<style>
body{
  margin:0;
  background:#0a0a0a;
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  height:100vh;
  font-family:system-ui;
  text-align:center;
}
</style>
</head>
<body>
  <div>
    <h2>You're Offline</h2>
    <p>Please check your internet connection</p>
  </div>
</body>
</html>`;

// ===============================
// INSTALL EVENT
// ===============================
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

// ===============================
// ACTIVATE EVENT (CLEAN OLD CACHE)
// ===============================
self.addEventListener("activate", event => {
  const KEEP = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES];

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (!KEEP.includes(key)) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ===============================
// FETCH EVENT
// ===============================
self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // HTML → Network First
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // JS / CSS / Images → Cache First
  if (/\.(js|css|png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // fallback
  event.respondWith(networkFallback(request));
});

// ===============================
// CACHE FIRST STRATEGY
// ===============================
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return offlinePage();
  }
}

// ===============================
// NETWORK FIRST (HTML)
// ===============================
async function networkFirstHTML(request) {
  const cache = await caches.open(CACHE_PAGES);

  try {
    const res = await fetch(request);

    if (res && res.ok) {
      cache.put(request, res.clone());
    }

    return res;
  } catch {
    const cached = await cache.match(request);
    return cached || offlinePage();
  }
}

// ===============================
// NETWORK FALLBACK
// ===============================
async function networkFallback(request) {
  try {
    return await fetch(request);
  } catch {
    return offlinePage();
  }
}

// ===============================
// OFFLINE PAGE SAFE RETURN
// ===============================
async function offlinePage() {
  const cache = await caches.open(CACHE_STATIC);
  return cache.match(OFFLINE_KEY);
}

// ===============================
// OPTIONAL: FORCE UPDATE ON NEW SW
// ===============================
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
