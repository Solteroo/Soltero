// ═══════════════════════════════════════════════════════════
//  sw.js — Soltero Dev | PWA Service Worker PRO v1.5.1
//  Fixes:
//   ✔ window bug removed
//   ✔ safe offline cache key
//   ✔ optimized caching
//   ✔ no blob memory leak
//   ✔ GitHub Pages compatible
// ═══════════════════════════════════════════════════════════

const SW_VERSION   = "soltero-v1.5.1";

const CACHE_STATIC = SW_VERSION + "-static";
const CACHE_PAGES  = SW_VERSION + "-pages";
const CACHE_IMAGES = SW_VERSION + "-images";

const OFFLINE_KEY = "offline-page";

// ── App Shell ───────────────────────────────────────────────
const PRECACHE_URLS = [
  "index.html",
  "projects.html",
  "services.html",
  "contact.html",
  "about.html",
  "soltero.css",
  "app.js",
  "i18n.js",
  "projects.js",
  "pwa-install.js"
];

// ── Offline HTML ────────────────────────────────────────────
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ru">
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
<p>No internet connection</p>
</body>
</html>`;

// ═════════════════ INSTALL ══════════════════════════════════
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

// ═════════════════ ACTIVATE ═════════════════════════════════
self.addEventListener("activate", event => {
  const KEEP = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES];

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !KEEP.includes(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ═════════════════ FETCH ROUTER ═════════════════════════════
self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip extensions
  if (url.protocol.startsWith("chrome-extension")) return;

  // ── HTML (network first)
  const isHTML =
    request.headers.get("accept")?.includes("text/html") ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/";

  if (isHTML) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // ── Images (cache first)
  if (/\.(png|jpg|jpeg|webp|svg|gif|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_IMAGES));
    return;
  }

  // ── JS/CSS (cache first)
  if (/\.(js|css|woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // ── Default
  event.respondWith(networkFallback(request));
});

// ═════════════════ STRATEGIES ═══════════════════════════════

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return offlineResponse();
  }
}

async function networkFirstHTML(request) {
  const cache = await caches.open(CACHE_PAGES);

  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_KEY);
    return offline || offlineResponse();
  }
}

async function networkFallback(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return await caches.match(request) || offlineResponse();
  }
}

function offlineResponse() {
  return new Response("Offline", { status: 503 });
}

// ═════════════════ PUSH NOTIFICATIONS ═══════════════════════
self.addEventListener("push", event => {
  let data = {};
  try {
    data = event.data.json();
  } catch {}

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Soltero Dev",
      {
        body: data.body || "",
        icon: "https://solteroo.github.io/Soltero/icon-192.png",
        badge: "https://solteroo.github.io/Soltero/icon-192.png",
        data: data.url || "index.html",
        vibrate: [200, 100, 200],
        tag: "soltero-push"
      }
    )
  );
});

// ═════════════════ NOTIFICATION CLICK ═══════════════════════
self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data || "index.html");
    })
  );
});

// ═════════════════ MESSAGE API ══════════════════════════════
self.addEventListener("message", event => {
  const data = event.data;

  if (!data) return;

  if (data.type === "SKIP_WAITING") self.skipWaiting();

  if (data.type === "CLEAR_CACHE") {
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    );
  }
});

// ═════════════════ LOG ══════════════════════════════════════
console.log("[SW] Soltero Dev v1.5.1 loaded ✔");
