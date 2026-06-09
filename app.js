// ═══════════════════════════════════════════════════════════
//  app.js — Soltero Dev | Central Controller (PRO FIXED)
// ═══════════════════════════════════════════════════════════

// ── State (FIX: global mutation replaced with safe object) ─
const state = {
  lang: localStorage.getItem("sdev_lang") || "ru",
  filter: "all"
};

const INDEX_PROJECTS_LIMIT = 4;

// ── Safe DATA GUARDS ───────────────────────────────────────
const SAFE_PRODUCTS = Array.isArray(PRODUCTS) ? PRODUCTS : [];
const SAFE_CATEGORIES = typeof CATEGORIES !== "undefined" ? CATEGORIES : {};
const SAFE_COLORS = typeof CAT_COLORS !== "undefined" ? CAT_COLORS : {};
const SAFE_STATUS = typeof STATUS_LABELS !== "undefined" ? STATUS_LABELS : {};

// ── Page Detection (FIXED safer logic) ──────────────────────
const PAGE = (() => {
  const attr = document.documentElement.dataset.page;
  if (attr) return attr;

  const path = location.pathname.toLowerCase();

  if (path.includes("/projects")) return "projects";
  if (path.includes("/services")) return "services";
  if (path.includes("/about")) return "about";
  if (path.includes("/contact")) return "contact";

  return "index";
})();

// ── Boot ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  applyLang(state.lang);
  _syncLangOptions(state.lang);

  switch (PAGE) {
    case "index":
      if (document.getElementById("projectsGrid")) {
        buildFilterButtons();
        renderProjects(INDEX_PROJECTS_LIMIT);
      }
      break;

    case "projects":
      if (document.getElementById("projectsGrid")) {
        buildFilterButtons();
        renderProjects();
      }
      break;

    case "services":
      renderServices();
      break;

    case "about":
      renderAbout();
      break;

    case "contact":
      renderContact();
      break;
  }

  _syncNavActive();

  document.getElementById("lang-overlay")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) closeLangModal();
  });
});

// ── Language System ────────────────────────────────────────
function applyLang(lang) {
  state.lang = lang;
  localStorage.setItem("sdev_lang", lang);
  document.documentElement.lang = lang;

  _applyLangText(lang);
  _syncLangMeta(lang);
  _syncLangOptions(lang);

  switch (PAGE) {
    case "index":
      updateFilterLabels();
      renderProjects(INDEX_PROJECTS_LIMIT);
      break;

    case "projects":
      updateFilterLabels();
      renderProjects();
      break;

    case "services":
      renderServices();
      break;

    case "about":
      renderAbout();
      break;

    case "contact":
      renderContact();
      break;
  }
}

function _applyLangText(lang) {
  const t = I18N?.[lang];
  if (!t) return;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if (!(k in t)) return;

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = t[k];
    } else {
      el.textContent = t[k];
    }
  });

  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const k = el.getAttribute("data-i18n-ph");
    if (t[k]) el.placeholder = t[k];
  });
}

function _syncLangMeta(lang) {
  const meta = LANG_META?.[lang];
  if (!meta) return;

  document.getElementById("headerFlag")?.replaceChildren(meta.flag);
  document.getElementById("headerCode")?.replaceChildren(meta.code);
}

function _syncLangOptions(lang) {
  document.querySelectorAll(".lang-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function openLangModal() {
  document.getElementById("lang-overlay")?.classList.add("open");
}
function closeLangModal() {
  document.getElementById("lang-overlay")?.classList.remove("open");
}
function setLang(lang) {
  applyLang(lang);
  setTimeout(closeLangModal, 200);
}

// ── Navigation ─────────────────────────────────────────────
function _syncNavActive() {
  const path = location.pathname.toLowerCase();

  document.querySelectorAll(".nav-item, .bnav-item").forEach(el => {
    const href = (el.getAttribute("href") || "").toLowerCase();

    const match =
      (href.includes("index") && (path === "/" || path.includes("index"))) ||
      (href.includes("projects") && path.includes("projects")) ||
      (href.includes("services") && path.includes("services")) ||
      (href.includes("contact") && path.includes("contact")) ||
      (href.includes("about") && path.includes("about"));

    if (match) el.classList.add("active");
  });
}

// ── Filters ────────────────────────────────────────────────
function buildFilterButtons() {
  const wrap = document.getElementById("filterBtns");
  if (!wrap) return;

  wrap.innerHTML = "";

  const cats = ["all", ...Object.keys(SAFE_CATEGORIES).filter(k => k !== "all")];

  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === state.filter ? " active" : "");
    btn.dataset.cat = cat;
    btn.onclick = () => setFilter(cat);

    if (cat !== "all") {
      const c = SAFE_COLORS[cat] || {};
      btn.style.cssText = `--cat-text:${c.text || "#fff"};--cat-bg:${c.bg || "#000"};--cat-border:${c.border || "#333"}`;
    }

    btn.textContent = SAFE_CATEGORIES[cat]?.[state.lang] || cat;

    wrap.appendChild(btn);
  });
}

function updateFilterLabels() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    const cat = btn.dataset.cat;
    btn.textContent = SAFE_CATEGORIES[cat]?.[state.lang] || cat;
  });
}

function setFilter(cat) {
  state.filter = cat;

  document.querySelectorAll(".filter-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.cat === cat)
  );

  renderProjects(PAGE === "index" ? INDEX_PROJECTS_LIMIT : undefined);
}

// ── Projects ───────────────────────────────────────────────
function renderProjects(limit) {
  const grid = document.getElementById("projectsGrid");
  const empty = document.getElementById("emptyState");
  if (!grid) return;

  let list = state.filter === "all"
    ? SAFE_PRODUCTS
    : SAFE_PRODUCTS.filter(p => p.category === state.filter);

  if (typeof limit === "number") list = list.slice(0, limit);

  if (list.length === 0) {
    grid.innerHTML = "";
    empty && (empty.style.display = "flex");
    return;
  }

  empty && (empty.style.display = "none");

  grid.innerHTML = list.map(buildCard).join("");

  requestAnimationFrame(() => {
    grid.querySelectorAll(".proj-card").forEach((card, i) => {
      card.style.animationDelay = (i * 0.06) + "s";
      card.classList.add("reveal");
    });
  });
}

function buildCard(p) {
  const t = I18N?.[state.lang] || {};

  const c = SAFE_COLORS[p.category] || SAFE_COLORS.web || {};
  const catLabel = SAFE_CATEGORIES[p.category]?.[state.lang] || p.category;

  const title = p.title?.[state.lang] || p.title?.ru || "";
  const desc = p.desc?.[state.lang] || p.desc?.ru || "";

  const btnLabel = SAFE_STATUS[p.status]?.[state.lang] || t.liveBtn || "Live";

  const isLive = p.status === "live" && p.url && p.url !== "#";

  const techTags = (p.tech || []).map(tag =>
    `<span class="tech-tag" style="color:${c.text || "#fff"};background:${c.bg || "#000"};border-color:${c.border || "#333"}">${tag}</span>`
  ).join("");

  return `
  <div class="proj-card" style="--cat-glow:${c.glow || "#000"};--cat-border:${c.border || "#333"};--cat-text:${c.text || "#fff"};--cat-bg:${c.bg || "#000"}">
    <div class="proj-img-wrap">
      <img class="proj-img" src="${p.image || ""}" loading="lazy">
      <div class="proj-img-overlay"></div>
      <span class="proj-cat-badge">${catLabel}</span>
      <span class="proj-year">${p.year || ""}</span>
    </div>

    <div class="proj-body">
      <div class="proj-title">${title}</div>
      <div class="proj-desc">${desc}</div>

      <div class="proj-tech">
        <span>${t.techLabel || "Tech"}</span>
        <div class="proj-tags">${techTags}</div>
      </div>

      ${
        isLive
          ? `<a class="proj-btn" href="${p.url}" target="_blank" rel="noopener">${ICON_EXTERNAL} ${btnLabel}</a>`
          : `<div class="proj-btn proj-btn-dim">${ICON_CLOCK} ${btnLabel}</div>`
      }
    </div>
  </div>`;
}

// ── Services ───────────────────────────────────────────────
function renderServices() {
  const el = document.getElementById("servicesContent");
  if (!el) return;

  const t = I18N?.[state.lang] || {};

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px">
      ${(t.services || []).map(s => `
        <div class="card service-card">
          <div class="service-name">${s.title}</div>
          <div class="service-desc">${s.desc}</div>
        </div>
      `).join("")}
    </div>
  `;
}

// ── About ──────────────────────────────────────────────────
function renderAbout() {
  const el = document.getElementById("aboutContent");
  if (!el) return;

  const t = I18N?.[state.lang] || {};

  el.querySelectorAll("[data-i18n]").forEach(n => {
    const k = n.getAttribute("data-i18n");
    if (t[k]) n.textContent = t[k];
  });

  const ap = window.aboutPage;
  if (ap) {
    ap.renderSkillBars(state.lang);
    ap.renderReviews(state.lang);
  }
}

// ── Contact ────────────────────────────────────────────────
function renderContact() {
  const el = document.getElementById("contactContent");
  if (!el) return;

  const t = I18N?.[state.lang] || {};

  el.querySelectorAll("[data-i18n]").forEach(n => {
    const k = n.getAttribute("data-i18n");
    if (t[k]) n.textContent = t[k];
  });
}

// ── Clipboard ──────────────────────────────────────────────
function copyToClipboard(text, el, msg = "✓") {
  const flash = () => {
    if (!el) return;
    const old = el.textContent;
    el.textContent = msg;
    setTimeout(() => el.textContent = old, 1200);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(flash).catch(() => legacy(text, flash));
  } else {
    legacy(text, flash);
  }
}

function legacy(text, cb) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); cb?.(); } catch {}
  document.body.removeChild(ta);
}

// ── Icons ──────────────────────────────────────────────────
const ICON_EXTERNAL = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

const ICON_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
