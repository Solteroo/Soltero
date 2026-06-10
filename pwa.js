(function () {
  "use strict";

  const KEY_INSTALLED = "sdev_installed";

  let bannerEl = null;
  let deferredPrompt = null;

  // =========================
  // CHECK INSTALLED
  // =========================
  function isInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      localStorage.getItem(KEY_INSTALLED) === "1"
    );
  }

  // =========================
  // CSS
  // =========================
  function injectCSS() {
    if (document.getElementById("sdev-css")) return;

    const style = document.createElement("style");
    style.id = "sdev-css";

    style.textContent = `
      .sdev-banner{
        position:fixed;
        top:18px;
        left:50%;
        transform:translateX(-50%) translateY(-10px);
        width:92%;
        max-width:420px;
        background:linear-gradient(145deg,#0f0f0f,#070707);
        border:1px solid rgba(212,175,55,.35);
        border-radius:16px;
        padding:14px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        z-index:99999;
        box-shadow:0 20px 50px rgba(0,0,0,.6);
        opacity:0;
        transition:.25s ease;
      }

      .sdev-banner.show{
        opacity:1;
        transform:translateX(-50%) translateY(0);
      }

      .sdev-title{
        color:#D4AF37;
        font-weight:700;
        font-size:13px;
      }

      .sdev-sub{
        color:#aaa;
        font-size:11px;
      }

      .sdev-btn{
        background:#D4AF37;
        color:#000;
        border:none;
        padding:8px 12px;
        border-radius:10px;
        font-weight:700;
        cursor:pointer;
      }

      .sdev-close{
        background:none;
        border:none;
        color:#888;
        font-size:16px;
        cursor:pointer;
      }
    `;

    document.head.appendChild(style);
  }

  // =========================
  // CREATE UI
  // =========================
  function createBanner() {
    if (bannerEl) return;

    const el = document.createElement("div");
    el.className = "sdev-banner";

    el.innerHTML = `
      <div>
        <div class="sdev-title">Install Soltero App</div>
        <div class="sdev-sub">Fast • Offline • Premium experience</div>
      </div>

      <button class="sdev-btn">Install</button>
      <button class="sdev-close">✕</button>
    `;

    document.body.appendChild(el);

    const installBtn = el.querySelector(".sdev-btn");
    const closeBtn = el.querySelector(".sdev-close");

    // INSTALL
    installBtn.onclick = async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      if (result.outcome === "accepted") {
        localStorage.setItem(KEY_INSTALLED, "1");
        removeBanner();
      }

      deferredPrompt = null;
    };

    // CLOSE (NO BLOCK NEXT VISIT)
    closeBtn.onclick = () => {
      removeBanner();
    };

    bannerEl = el;
  }

  // =========================
  // SHOW / HIDE
  // =========================
  function showBanner() {
    if (!bannerEl) createBanner();

    requestAnimationFrame(() => {
      bannerEl.classList.add("show");
    });
  }

  function removeBanner() {
    bannerEl?.classList.remove("show");

    setTimeout(() => {
      bannerEl?.remove();
      bannerEl = null;
    }, 200);
  }

  // =========================
  // INIT
  // =========================
  function init() {
    injectCSS();

    if (isInstalled()) return;

    // IMPORTANT: PWA must be installable
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // show after small delay (UX polish)
      setTimeout(() => {
        showBanner();
      }, 900);
    });

    window.addEventListener("appinstalled", () => {
      localStorage.setItem(KEY_INSTALLED, "1");
      removeBanner();
    });
  }

  // =========================
  // BOOT
  // =========================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
