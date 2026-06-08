// ═══════════════════════════════════════════════════════════
//  sw.js — Soltero Dev | Professional Service Worker v1.5.0
//  Düzedilen buglar:
//    • "/" PRECACHE_URLS-den aýryldy (static hosting 404 berýärdi)
//    • HTML sahypalar diňe CACHE_PAGES-e ýazylýar
//    • SW register merkezi şu faýlda däl — pwa-install.js edýär
//    • networkFirst içinde cache dogry saýlanylýar
// ═══════════════════════════════════════════════════════════

const SW_VERSION   = "soltero-v1.5.0";
const CACHE_STATIC = SW_VERSION + "-static";
const CACHE_PAGES  = SW_VERSION + "-pages";
const CACHE_IMAGES = SW_VERSION + "-images";

// ── App Shell — diňe faýl ady (root-dan) ──────────────────
// BUG FIX: "/" aýryldy — static hosting-de 404 berýärdi
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

// ── Offline fallback (inline — aýratyn faýl gerek däl) ────
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Soltero Dev — Offline</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      background:#080705;color:#fff;
      font-family:'Raleway',system-ui,sans-serif;
      display:flex;align-items:center;justify-content:center;
      min-height:100vh;padding:24px;text-align:center
    }
    .wrap{max-width:320px}
    .logo{
      width:72px;height:72px;border-radius:18px;
      border:1px solid rgba(201,168,76,.3);
      background:rgba(201,168,76,.07);
      display:flex;align-items:center;justify-content:center;
      margin:0 auto 24px;font-size:32px
    }
    h1{
      font-size:20px;font-weight:800;letter-spacing:.1em;
      background:linear-gradient(135deg,#C9A84C,#E8C96A);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;margin-bottom:10px
    }
    p{color:rgba(255,255,255,.4);font-size:13px;line-height:1.75;margin-bottom:28px}
    a{
      display:inline-block;padding:11px 28px;border-radius:10px;
      background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.28);
      color:#C9A84C;font-size:13px;font-weight:600;text-decoration:none;
      transition:.2s
    }
    a:hover{background:rgba(201,168,76,.22)}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">⚡</div>
    <h1>SOLTERO DEV</h1>
    <p>Häzir internet ýok. Birikme dikeldilende sahypa öz-özünden ýüklenýär.</p>
    <a href="index.html">Gaýtadan synanyş</a>
  </div>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════
//  INSTALL — app shell pre-cache
// ═══════════════════════════════════════════════════════════
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async cache => {
      // Her URL aýratyn — biri 404 bolsa beýlekileri blokirlemesin
      await Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn("[SW] Pre-cache skip:", url, err.message)
          )
        )
      );
      // Offline fallback inline saklansyn
      await cache.put(
        "/_offline",
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        })
      );
    })
  );
  self.skipWaiting();
});

// ═══════════════════════════════════════════════════════════
//  ACTIVATE — köne cache-leri arassala
// ═══════════════════════════════════════════════════════════
self.addEventListener("activate", event => {
  const KEEP = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES];
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => !KEEP.includes(k))
            .map(k => {
              console.log("[SW] Köne cache pozuldy:", k);
              return caches.delete(k);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ═══════════════════════════════════════════════════════════
//  FETCH — routing
// ═══════════════════════════════════════════════════════════
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Diňe GET
  if (request.method !== "GET") return;

  // Extension-lar — geç
  if (url.protocol === "chrome-extension:" || url.protocol === "moz-extension:") return;

  // Google Fonts — stale-while-revalidate
  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
    return;
  }

  // Daşarky suratlar — cache-first, 30 gün
  if (
    url.hostname.includes("unsplash.com") ||
    url.hostname.includes("i.ibb.co") ||
    url.hostname.includes("ibb.co") ||
    /\.(png|jpg|jpeg|webp|avif|gif|svg|ico)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirstWithExpiry(request, CACHE_IMAGES, 30));
    return;
  }

  // HTML sahypalar — network-first, offline fallback
  // BUG FIX: CACHE_PAGES ulanylýar (öň CACHE_STATIC-e gidýärdi)
  const isHTML =
    request.headers.get("Accept")?.includes("text/html") ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/" ||
    url.pathname === "";

  if (isHTML) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // JS / CSS / font — cache-first
  if (/\.(js|css|woff2?|ttf|otf)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Galanlary — network + cache fallback
  event.respondWith(networkFallback(request));
});

// ═══════════════════════════════════════════════════════════
//  STRATEGIÝA FUNKSIÝALARY
// ═══════════════════════════════════════════════════════════

/** Cache-first: cache → network → cache-e ýaz */
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const offline = await caches.match("/_offline");
    return offline || new Response("Offline", { status: 503 });
  }
}

/** Cache-first + möhlet (gün) */
async function cacheFirstWithExpiry(request, cacheName, days) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get("sw-cached-date");
    if (dateHeader) {
      const expiresAt = new Date(dateHeader).getTime() + days * 864e5;
      if (Date.now() < expiresAt) return cached;
      // Möhleti geçdi — fondan täzele
    } else {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set("sw-cached-date", new Date().toUTCString());
      const stamped = new Response(await response.blob(), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
      cache.put(request, stamped.clone());
      return stamped;
    }
    return response;
  } catch {
    return cached || new Response("", { status: 503 });
  }
}

/**
 * Network-first HTML (BUG FIX: CACHE_PAGES-e ýazylýar)
 * Network → CACHE_PAGES-e ýaz
 * Fail → CACHE_PAGES → CACHE_STATIC → /_offline
 */
async function networkFirstHTML(request) {
  const cache = await caches.open(CACHE_PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // 1. Sahypa cache-i
    const fromPages  = await cache.match(request);
    if (fromPages) return fromPages;
    // 2. Pre-cache (install wagtynda ýüklenip bolar)
    const fromStatic = await caches.match(request, { cacheName: CACHE_STATIC });
    if (fromStatic) return fromStatic;
    // 3. Offline sahypa
    return (await caches.match("/_offline")) ||
           new Response("<h1>Offline</h1>", {
             status: 503,
             headers: { "Content-Type": "text/html" }
           });
  }
}

/** Network + cache fallback (beýleki resurslar üçin) */
async function networkFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) ||
           new Response("", { status: 503 });
  }
}

/** Stale-while-revalidate: cache-den derrew, fondan täzele */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fondan täzeleme (background)
  const networkPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Cache bar → derrew ber, fon täzelär
  if (cached) return cached;
  // Cache ýok → network-i garaş
  return (await networkPromise) || (await caches.match("/_offline"));
}

// ═══════════════════════════════════════════════════════════
//  MESSAGE — client ↔ SW
// ═══════════════════════════════════════════════════════════
self.addEventListener("message", event => {
  if (!event.data) return;
  switch (event.data.type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;
    case "GET_VERSION":
      event.ports[0]?.postMessage({ version: SW_VERSION });
      break;
    case "CLEAR_CACHE":
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => event.ports[0]?.postMessage({ ok: true }));
      break;
  }
});
window.addEventListener('beforeinstallprompt', (e) => {
  console.log("INSTALL READY");
});
// ═══════════════════════════════════════════════════════════
//  PUSH — geljek üçin taýýar infrastruktura
// ═══════════════════════════════════════════════════════════
self.addEventListener("push", event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: "Soltero Dev" }; }
  event.waitUntil(
    self.registration.showNotification(data.title || "Soltero Dev", {
      body:     data.body    || "",
      icon:     "https://i.ibb.co/bjzxBrFX/logo.png",
      badge:    "https://i.ibb.co/bjzxBrFX/logo.png",
      data:     data.url     || "index.html",
      vibrate:  [200, 100, 200],
      tag:      "soltero-push",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && "focus" in c) return c.focus();
      }
      return clients.openWindow(event.notification.data || "index.html");
    })
  );
});

console.log("[SW] " + SW_VERSION + " loaded ✓");
