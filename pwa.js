// ═══════════════════════════════════════════════════════════
//  pwa-install.js — Soltero Dev | Smart PWA Install Banner
//  • Catches beforeinstallprompt (Android/Chrome/Edge)
//  • iOS fallback instructions (Safari)
//  • Install button in index hero
//  • Dismissal memory (localStorage)
// ═══════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ── Config ───────────────────────────────────────────────
  const DISMISS_KEY    = "sdev_pwa_dismissed";
  const DISMISS_DAYS   = 14;          // re-show banner after N days
  const INSTALL_KEY    = "sdev_pwa_installed";

  // ── State ────────────────────────────────────────────────
  let deferredPrompt = null;          // BeforeInstallPromptEvent
  let installBtnEl   = null;
  let bannerEl       = null;

  // ── Helpers ──────────────────────────────────────────────
  function isInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      localStorage.getItem(INSTALL_KEY) === "1"
    );
  }

  function isDismissed() {
    const ts = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
    return ts && Date.now() - ts < DISMISS_DAYS * 864e5;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  // ── Inject CSS (once) ────────────────────────────────────
  function injectCSS() {
    if (document.getElementById("pwa-install-css")) return;
    const style = document.createElement("style");
    style.id = "pwa-install-css";
    style.textContent = `
      /* ── Install button (hero area) ── */
      #pwa-install-btn {
        display: none;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border-radius: 10px;
        border: 1px solid rgba(212,175,55,.35);
        background: rgba(212,175,55,.1);
        color: #D4AF37;
        font-family: 'Raleway', sans-serif;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: background .2s, box-shadow .2s, transform .15s;
        position: relative;
        overflow: hidden;
        letter-spacing: .04em;
      }
      #pwa-install-btn:hover {
        background: rgba(212,175,55,.18);
        box-shadow: 0 0 20px rgba(212,175,55,.25);
        transform: translateY(-1px);
      }
      #pwa-install-btn:active { transform: translateY(0); }
      #pwa-install-btn.visible { display: inline-flex; }
      #pwa-install-btn .pwa-btn-shimmer {
        position: absolute; inset: 0;
        background: linear-gradient(105deg, transparent 40%, rgba(212,175,55,.18) 50%, transparent 60%);
        animation: pwaShimmer 3s infinite;
      }
      @keyframes pwaShimmer {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }

      /* ── iOS banner ── */
      #pwa-ios-banner {
        display: none;
        position: fixed;
        bottom: 80px; /* above bottom-nav */
        left: 16px; right: 16px;
        background: rgba(10,9,8,.96);
        border: 1px solid rgba(212,175,55,.25);
        border-radius: 16px;
        padding: 16px 16px 14px;
        z-index: 9999;
        box-shadow: 0 8px 40px rgba(0,0,0,.6), 0 0 0 1px rgba(212,175,55,.08);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        animation: bannerSlideUp .35s cubic-bezier(.16,1,.3,1) both;
      }
      #pwa-ios-banner.visible { display: block; }
      @keyframes bannerSlideUp {
        from { opacity:0; transform:translateY(24px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .pwa-ios-row {
        display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
      }
      .pwa-ios-logo {
        width: 44px; height: 44px; border-radius: 10px;
        border: 1px solid rgba(212,175,55,.2);
        background: rgba(212,175,55,.08);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .pwa-ios-logo img { width: 28px; height: 28px; object-fit: contain; }
      .pwa-ios-title {
        font-weight: 800; font-size: 14px; color: #fff; letter-spacing: .05em;
      }
      .pwa-ios-sub {
        font-size: 11px; color: rgba(255,255,255,.4); margin-top: 2px;
      }
      .pwa-ios-steps {
        font-size: 12px; color: rgba(255,255,255,.55); line-height: 1.9;
        border-top: 1px solid rgba(212,175,55,.1); padding-top: 10px;
        margin-bottom: 12px;
      }
      .pwa-ios-steps b { color: #D4AF37; }
      .pwa-ios-actions { display: flex; justify-content: flex-end; gap: 8px; }
      .pwa-ios-dismiss {
        padding: 8px 16px; border-radius: 8px;
        background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
        color: rgba(255,255,255,.45); font-size: 12px; font-weight: 600;
        cursor: pointer; transition: background .2s;
      }
      .pwa-ios-dismiss:hover { background: rgba(255,255,255,.1); }

      /* ── Update toast ── */
      #pwa-update-toast {
        display: none;
        position: fixed;
        top: 70px; right: 16px;
        background: rgba(10,9,8,.96);
        border: 1px solid rgba(212,175,55,.25);
        border-radius: 12px;
        padding: 12px 16px;
        z-index: 9998;
        gap: 12px;
        align-items: center;
        box-shadow: 0 4px 24px rgba(0,0,0,.5);
        backdrop-filter: blur(12px);
        max-width: 280px;
        animation: toastSlideIn .3s ease both;
      }
      #pwa-update-toast.visible { display: flex; }
      @keyframes toastSlideIn {
        from { opacity:0; transform:translateX(20px); }
        to   { opacity:1; transform:translateX(0); }
      }
      .toast-text { font-size: 12px; color: rgba(255,255,255,.7); flex:1; line-height:1.5; }
      .toast-reload {
        padding: 7px 14px; border-radius: 8px;
        background: rgba(212,175,55,.15); border: 1px solid rgba(212,175,55,.3);
        color: #D4AF37; font-size: 12px; font-weight: 700;
        cursor: pointer; white-space: nowrap; flex-shrink: 0;
        transition: background .2s;
      }
      .toast-reload:hover { background: rgba(212,175,55,.25); }
      .toast-close {
        width: 22px; height: 22px; cursor: pointer;
        color: rgba(255,255,255,.3); flex-shrink: 0;
        background: none; border: none; font-size: 16px; line-height:1;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Create install button in hero ────────────────────────
  function createInstallButton() {
    if (document.getElementById("pwa-install-btn")) return;
    const btn = document.createElement("button");
    btn.id = "pwa-install-btn";
    btn.setAttribute("aria-label", "Install app");
    btn.innerHTML = `
      <div class="pwa-btn-shimmer"></div>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span id="pwa-install-label">Install App</span>
    `;
    btn.onclick = triggerInstall;

    // Insert after the hero action buttons row
    const heroActions = document.querySelector(".hero-actions");
    if (heroActions) {
      // Insert as a sibling after
      heroActions.insertAdjacentElement("afterend", btn);
    } else {
      // Fallback: before bottom-nav
      const bottomNav = document.querySelector(".bottom-nav");
      if (bottomNav) document.body.insertBefore(btn, bottomNav);
    }

    installBtnEl = btn;
    return btn;
  }

  // ── Create iOS install banner ────────────────────────────
  function createIOSBanner() {
    if (document.getElementById("pwa-ios-banner")) return;
    const banner = document.createElement("div");
    banner.id = "pwa-ios-banner";
    banner.innerHTML = `
      <div class="pwa-ios-row">
        <div class="pwa-ios-logo"><img src="https://i.ibb.co/bjzxBrFX/logo.png" alt="Soltero Dev"></div>
        <div>
          <div class="pwa-ios-title">SOLTERO DEV</div>
          <div class="pwa-ios-sub">Install to your Home Screen</div>
        </div>
      </div>
      <div class="pwa-ios-steps">
        1. Tap <b>Share</b> <svg style="display:inline;vertical-align:middle" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> in Safari<br>
        2. Scroll and tap <b>"Add to Home Screen"</b> <svg style="display:inline;vertical-align:middle" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      </div>
      <div class="pwa-ios-actions">
        <button class="pwa-ios-dismiss" id="pwa-ios-dismiss">Maybe later</button>
      </div>
    `;
    document.body.appendChild(banner);
    bannerEl = banner;

    document.getElementById("pwa-ios-dismiss").onclick = () => {
      banner.classList.remove("visible");
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    };
  }

  // ── Create SW update toast ────────────────────────────────
  function createUpdateToast() {
    if (document.getElementById("pwa-update-toast")) return;
    const toast = document.createElement("div");
    toast.id = "pwa-update-toast";
    toast.innerHTML = `
      <div class="toast-text">New version available!</div>
      <button class="toast-reload" onclick="window.location.reload()">Update</button>
      <button class="toast-close" onclick="this.parentElement.classList.remove('visible')" aria-label="Close">✕</button>
    `;
    document.body.appendChild(toast);
    return toast;
  }

  // ── Update install button label (multilang) ───────────────
  function updateInstallLabel() {
    const label = document.getElementById("pwa-install-label");
    if (!label) return;
    const lang = localStorage.getItem("sdev_lang") || "ru";
    const labels = {
      tk: "Programma Gurnamak",
      ru: "Установить приложение",
      en: "Install App"
    };
    label.textContent = labels[lang] || labels.en;
  }

  // ── Trigger install prompt (Android / Chrome / Edge) ─────
  async function triggerInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === "accepted") {
      localStorage.setItem(INSTALL_KEY, "1");
      hideInstallUI();
    }
  }

  function showInstallButton() {
    if (!installBtnEl) return;
    installBtnEl.classList.add("visible");
    updateInstallLabel();
  }

  function hideInstallUI() {
    installBtnEl?.classList.remove("visible");
    bannerEl?.classList.remove("visible");
  }

  // ── Boot ─────────────────────────────────────────────────
  function init() {
    injectCSS();
    createInstallButton();
    createUpdateToast();

    // Already installed → nothing to show
    if (isInstalled()) return;

    // iOS Safari: custom instructions banner
    if (isIOS() && isSafari() && !isDismissed()) {
      createIOSBanner();
      setTimeout(() => bannerEl?.classList.add("visible"), 3500);
      return;
    }

    // Android / Desktop: wait for browser prompt
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButton();
      updateInstallLabel();
    });

    // App installed (browser event)
    window.addEventListener("appinstalled", () => {
      localStorage.setItem(INSTALL_KEY, "1");
      hideInstallUI();
    });

    // Keep label in sync with language changes
    window.addEventListener("sdev_lang_change", updateInstallLabel);
  }

  // ── SW update detection ──────────────────────────────────
  function watchSWUpdates() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // A new SW installed while page is open → show update toast
            const toast = document.getElementById("pwa-update-toast");
            if (toast) toast.classList.add("visible");
          }
        });
      });
    });

    // If SW sends SKIP_WAITING, reload automatically
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }

  // ── Run ──────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", watchSWUpdates);

  // Expose for manual trigger (optional)
  window.PWAInstall = { trigger: triggerInstall, updateLabel: updateInstallLabel };

})();
