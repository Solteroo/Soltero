// ===============================
//  SOLTERO PWA SERVICE WORKER
//  Production Ready v2 (FIXED)
// ===============================

const SW_VERSION = "soltero-v1.5.5";

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
// OFFLINE PAGE (KEPT - IMPORTANT)
// ===============================
const OFFLINE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Offline • Soltero Dev</title>

<style>
:root{
  --bg:#070707;
  --card:#0e0e0e;
  --gold:#d4af37;
  --text:#ffffff;
  --muted:#9a9a9a;
}

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:system-ui,-apple-system,sans-serif;
}

body{
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--bg);
  color:var(--text);
}

/* subtle gold glow background */
body::before{
  content:"";
  position:absolute;
  width:400px;
  height:400px;
  background:radial-gradient(circle, rgba(212,175,55,0.15), transparent 70%);
  top:-100px;
  left:-100px;
  filter:blur(20px);
}

.card{
  width:90%;
  max-width:380px;
  background:linear-gradient(145deg,#0f0f0f,#0a0a0a);
  border:1px solid rgba(212,175,55,0.25);
  border-radius:18px;
  padding:28px;
  text-align:center;
  position:relative;
}

.badge{
  display:inline-block;
  font-size:11px;
  padding:5px 10px;
  border-radius:999px;
  border:1px solid rgba(212,175,55,0.4);
  color:var(--gold);
  margin-bottom:14px;
}

.icon{
  width:55px;
  height:55px;
  margin:0 auto 15px;
  border-radius:50%;
  border:1px solid rgba(212,175,55,0.5);
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--gold);
  font-size:22px;
}

h1{
  font-size:20px;
  margin-bottom:8px;
}

p{
  font-size:13px;
  color:var(--muted);
  line-height:1.5;
  margin-bottom:18px;
}

.btn{
  display:inline-block;
  padding:9px 16px;
  background:var(--gold);
  color:#000;
  font-weight:600;
  border-radius:10px;
  text-decoration:none;
  transition:0.2s ease;
}

.btn:active{
  transform:scale(0.97);
}

.footer{
  margin-top:14px;
  font-size:11px;
  color:#666;
}
</style>
</head>

<body>

<div class="card">

  <div class="badge">OFFLINE MODE</div>

  <div class="icon">⚡</div>

  <h1>Connection Lost</h1>

  <p>
    You are currently offline.<br>
    Cached content will load automatically if available.
  </p>

  <a class="btn" onclick="location.reload()">Retry</a>

  <div class="footer">
    Soltero Dev • Black Gold PWA
  </div>

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

      // store offline page
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

  // ===========================
  // HTML → NETWORK FIRST
  // ===========================
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // ===========================
  // JS / CSS / IMAGES → CACHE FIRST
  // ===========================
  if (/\.(js|css|png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // ===========================
  // FALLBACK
  // ===========================
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
    return cached || offlinePage();
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
      return res;
    }
  } catch (e) {}

  // ✔ fallback to cache first
  const cached = await cache.match(request);
  if (cached) return cached;

  // ✔ ONLY if nothing exists → offline page
  return offlinePage();
}

// ===============================
// NETWORK FALLBACK
// ===============================
async function networkFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_STATIC);
    return cache.match(request) || offlinePage();
  }
}

// ===============================
// OFFLINE PAGE
// ===============================
async function offlinePage() {
  const cache = await caches.open(CACHE_STATIC);
  return cache.match(OFFLINE_KEY);
}

// ===============================
// FORCE UPDATE SUPPORT
// ===============================
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
