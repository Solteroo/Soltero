// ═══════════════════════════════════════════════════════════
//  app.js — Soltero Dev | STABLE FINAL CORE FIX
// ═══════════════════════════════════════════════════════════

const state = {
  lang: localStorage.getItem("sdev_lang") || "ru",
  filter: "all"
};

const INDEX_PROJECTS_LIMIT = 4;

// ── SAFE DATA ──────────────────────────────────────────────
const PRODUCTS = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
const CATEGORIES = window.CATEGORIES || {};
const CAT_COLORS = window.CAT_COLORS || {};
const STATUS_LABELS = window.STATUS_LABELS || {};
const I18N = window.I18N || {};
const LANG_META = window.LANG_META || {};

// ── PAGE DETECT ───────────────────────────────────────────
const PAGE = (() => {
  const attr = document.documentElement.dataset.page;
  if (attr) return attr;

  const p = location.pathname.toLowerCase();
  if (p.includes("projects")) return "projects";
  if (p.includes("services")) return "services";
  if (p.includes("about")) return "about";
  if (p.includes("contact")) return "contact";
  return "index";
})();

// ═══════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  applyLang(state.lang);
  _syncLangOptions(state.lang);

  initPage();
  _syncNavActive();
});

// ── INIT ROUTER ───────────────────────────────────────────
function initPage() {
  if (PAGE === "index" || PAGE === "projects") {
    const grid = document.getElementById("projectsGrid");
    if (grid) {
      buildFilterButtons();
      renderProjects(PAGE === "index" ? INDEX_PROJECTS_LIMIT : undefined);
    }
  }

  if (PAGE === "services") renderServices();
  if (PAGE === "about") renderAbout();
  if (PAGE === "contact") renderContact();
}

// ═══════════════════════════════════════════════════════════
// LANGUAGE SYSTEM
// ═══════════════════════════════════════════════════════════
function applyLang(lang) {
  state.lang = lang;
  localStorage.setItem("sdev_lang", lang);
  document.documentElement.lang = lang;

  _applyLangText(lang);
  _syncLangMeta(lang);

  initPage();
}

function _applyLangText(lang) {
  const t = I18N?.[lang];
  if (!t) return;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (!t[key]) return;
    el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const key = el.getAttribute("data-i18n-ph");
    if (t[key]) el.placeholder = t[key];
  });
}

function _syncLangMeta(lang) {
  const m = LANG_META?.[lang];
  if (!m) return;
  document.getElementById("headerFlag")?.replaceChildren(m.flag);
  document.getElementById("headerCode")?.replaceChildren(m.code);
}

function _syncLangOptions(lang) {
  document.querySelectorAll(".lang-option").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
}

function openLangModal(){document.getElementById("lang-overlay")?.classList.add("open")}
function closeLangModal(){document.getElementById("lang-overlay")?.classList.remove("open")}
function setLang(l){applyLang(l); setTimeout(closeLangModal,200)}

// ═══════════════════════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════════════════════
function buildFilterButtons() {
  const wrap = document.getElementById("filterBtns");
  if (!wrap) return;

  wrap.innerHTML = "";

  const cats = ["all", ...Object.keys(CATEGORIES)];

  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (state.filter === cat ? " active" : "");
    btn.dataset.cat = cat;
    btn.onclick = () => setFilter(cat);
    btn.textContent = CATEGORIES?.[cat]?.[state.lang] || cat;
    wrap.appendChild(btn);
  });
}

function setFilter(cat) {
  state.filter = cat;
  document.querySelectorAll(".filter-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.cat === cat)
  );
  renderProjects(PAGE === "index" ? INDEX_PROJECTS_LIMIT : undefined);
}

// ═══════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════
function renderProjects(limit) {
  const grid = document.getElementById("projectsGrid");
  const empty = document.getElementById("emptyState");
  if (!grid) return;

  let list = state.filter === "all"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === state.filter);

  if (typeof limit === "number") list = list.slice(0, limit);

  if (!list.length) {
    grid.innerHTML = "";
    empty && (empty.style.display = "flex");
    return;
  }

  empty && (empty.style.display = "none");
  grid.innerHTML = list.map(buildCard).join("");
}

function buildCard(p) {
  const t = I18N?.[state.lang] || {};
  const c = CAT_COLORS[p.category] || {};

  return `
  <div class="proj-card">
    <div class="proj-img-wrap">
      <img src="${p.image || ""}" loading="lazy">
      <span>${CATEGORIES?.[p.category]?.[state.lang] || p.category}</span>
    </div>

    <div class="proj-body">
      <div class="proj-title">${p.title?.[state.lang] || ""}</div>
      <div class="proj-desc">${p.desc?.[state.lang] || ""}</div>
      <a class="proj-btn" href="${p.url || "#"}">${t.liveBtn || "Live"}</a>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
// SERVICES (FIX — NO MORE DISAPPEARING)
// ═══════════════════════════════════════════════════════════
const SERVICES_DATA = [
  {
    title: { ru: "Web Разработка", en: "Web Development", tk: "Web Düzgün" },
    desc:  { ru: "Сайты и приложения", en: "Web apps & sites", tk: "Saýt we app" }
  },
  {
    title: { ru: "AI Системы", en: "AI Systems", tk: "AI ulgamlar" },
    desc:  { ru: "Автоматизация", en: "Automation", tk: "Awto sistemalar" }
  }
];

function renderServices() {
  const el = document.getElementById("servicesContent");
  if (!el) return;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
      ${SERVICES_DATA.map(s => `
        <div class="card">
          <div>${s.title[state.lang]}</div>
          <div style="opacity:.6">${s.desc[state.lang]}</div>
        </div>
      `).join("")}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// ABOUT / CONTACT
// ═══════════════════════════════════════════════════════════
function renderAbout() {
  const t = I18N?.[state.lang] || {};
  document.querySelectorAll("[data-i18n]").forEach(n => {
    const k = n.getAttribute("data-i18n");
    if (t[k]) n.textContent = t[k];
  });
}

function renderContact() {
  renderAbout();
}

// ═══════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════
function _syncNavActive() {
  const p = location.pathname.toLowerCase();
  document.querySelectorAll(".nav-item, .bnav-item").forEach(el => {
    const h = el.getAttribute("href") || "";
    if (p.includes(h.replace(".html",""))) el.classList.add("active");
  });
}
