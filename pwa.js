// ═══════════════════════════════════════════════════════════
//  pwa-install.js — Soltero Dev | Smart PWA Install Banner (FIXED)
// ═══════════════════════════════════════════════════════════

(function () {
  "use strict";

  const DISMISS_KEY  = "sdev_pwa_dismissed";
  const DISMISS_DAYS = 14;
  const INSTALL_KEY  = "sdev_pwa_installed";

  let deferredPrompt = null;
  let installBtnEl   = null;
  let bannerEl       = null;

  function isInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      localStorage.getItem(INSTALL_KEY) === "1"
    );
  }

  function isDismissed() {
    const ts = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
    if (!ts) return false;

    // FIX: auto-expire old dismiss state
    if (Date.now() - ts > DISMISS_DAYS * 864e5) {
      localStorage.removeItem(DISMISS_KEY);
      return false;
    }

    return true;
  }

  function isIOS() {
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  function injectCSS() {
    if (document.getElementById("pwa-install-css")) return;

    const style = document.createElement("style");
    style.id = "pwa-install-css";
    style.textContent = `
      #pwa-install-btn{
        display:none;
        align-items:center;
        gap:8px;
        padding:10px 20px;
        border-radius:10px;
        border:1px solid rgba(212,175,55,.35);
        background:rgba(212,175,55,.1);
        color:#D4AF37;
        font-family:Raleway,sans-serif;
        font-size:13px;
        font-weight:700;
        cursor:pointer;
        transition:.2s;
        position:relative;
        overflow:hidden;
      }
      #pwa-install-btn.visible{display:inline-flex}
      #pwa-install-btn:hover{transform:translateY(-1px);background:rgba(212,175,55,.18)}
      #pwa-install-btn .pwa-btn-shimmer{
        position:absolute;inset:0;
        background:linear-gradient(105deg,transparent 40%,rgba(212,175,55,.18) 50%,transparent 60%);
        animation:pwaShimmer 3s infinite;
      }
      @keyframes pwaShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}

      #pwa-ios-banner{
        display:none;
        position:fixed;
        bottom:80px;
        left:16px;right:16px;
        background:rgba(10,9,8,.96);
        border:1px solid rgba(212,175,55,.25);
        border-radius:16px;
        padding:16px;
        z-index:9999;
        backdrop-filter:blur(16px);
      }
      #pwa-ios-banner.visible{display:block}
    `;
    document.head.appendChild(style);
  }

  function createInstallButton() {
    if (document.getElementById("pwa-install-btn")) return;

    const btn = document.createElement("button");
    btn.id = "pwa-install-btn";
    btn.innerHTML = `
      <div class="pwa-btn-shimmer"></div>
      <span>Install App</span>
    `;
    btn.onclick = triggerInstall;

    const heroActions = document.querySelector(".hero-actions");

    if (heroActions) {
      heroActions.insertAdjacentElement("afterend", btn);
    } else {
      document.body.appendChild(btn);
    }

    installBtnEl = btn;
  }

  function createIOSBanner() {
    if (document.getElementById("pwa-ios-banner")) return;

    const banner = document.createElement("div");
    banner.id = "pwa-ios-banner";
    banner.innerHTML = `
      <div style="color:#fff;font-weight:700;margin-bottom:8px">
        Install on iPhone
      </div>
      <div style="color:rgba(255,255,255,.6);font-size:12px;line-height:1.6">
        Share → Add to Home Screen
      </div>
      <button id="pwa-ios-dismiss"
        style="margin-top:10px;padding:8px 12px;border-radius:8px;background:#222;color:#aaa;border:none">
        Close
      </button>
    `;

    document.body.appendChild(banner);
    bannerEl = banner;

    document.getElementById("pwa-ios-dismiss").onclick = () => {
      banner.classList.remove("visible");
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    };
  }

  function createUpdateToast() {
    if (document.getElementById("pwa-update-toast")) return;

    const toast = document.createElement("div");
    toast.id = "pwa-update-toast";
    toast.innerHTML = `
      <div>New version available</div>
      <button onclick="location.reload()">Update</button>
    `;
    document.body.appendChild(toast);
  }

  function updateInstallLabel() {
    const lang = localStorage.getItem("sdev_lang") || "ru";
    const label = document.getElementById("pwa-install-label");

    if (!label) return;

    const map = {
      tk: "Gurnamak",
      ru: "Установить",
      en: "Install"
    };

    label.textContent = map[lang] || map.en;
  }

  async function triggerInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    deferredPrompt = null;

    if (outcome === "accepted") {
      localStorage.setItem(INSTALL_KEY, "1");
      hideUI();
    }
  }

  function showButton() {
    installBtnEl?.classList.add("visible");
    updateInstallLabel();
  }

  function hideUI() {
    installBtnEl?.classList.remove("visible");
    bannerEl?.classList.remove("visible");
  }

  function init() {
    injectCSS();
    createInstallButton();
    createUpdateToast();

    if (isInstalled()) return;

    if (isIOS() && isSafari() && !isDismissed()) {
      createIOSBanner();
      setTimeout(() => bannerEl?.classList.add("visible"), 2500);
      return;
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showButton();
    });

    window.addEventListener("appinstalled", () => {
      localStorage.setItem(INSTALL_KEY, "1");
      hideUI();
    });

    window.addEventListener("sdev_lang_change", updateInstallLabel);
  }

  function watchSWUpdates() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;

        sw?.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            document.getElementById("pwa-update-toast")
              ?.classList.add("visible");
          }
        });
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      location.reload();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", watchSWUpdates);

  window.PWAInstall = {
    trigger: triggerInstall,
    updateLabel: updateInstallLabel
  };

})();
