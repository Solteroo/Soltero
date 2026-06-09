// ═══════════════════════════════════════════════════════════
//  app.js — Soltero Dev | Central Controller (Refactored)
// ═══════════════════════════════════════════════════════════

// ── Constants ──────────────────────────────────────────────
const INDEX_PROJECTS_LIMIT = 4; // index preview card sany — centrallaşdyrylan
let currentLang  = localStorage.getItem("sdev_lang") || "ru";
let activeFilter = "all";

// ── Page Detection ─────────────────────────────────────────
// Primary: <html data-page="..."> set in each HTML file.
// Fallback: location.pathname (for pages not yet updated).
const PAGE = (() => {
  const attr = document.documentElement.dataset.page;
  if (attr) return attr;
  const path = location.pathname;
  if (path.includes("projects")) return "projects";
  if (path.includes("services")) return "services";
  if (path.includes("about"))    return "about";
  if (path.includes("contact"))  return "contact";
  return "index";
})();

// ── Boot (single DOMContentLoaded) ────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // 1. Apply language (text-only, no re-render on first load)
  _applyLangText(currentLang);
  _syncLangMeta(currentLang);
  _syncLangOptions(currentLang);

  // 2. Page-specific init — each page renders itself exactly once
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
        renderProjects(); // no limit on projects page
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

  // 3. Nav active state
  _syncNavActive();

  // 4. Lang overlay — close on backdrop click
  document.getElementById("lang-overlay")?.addEventListener("click", function (e) {
    if (e.target === this) closeLangModal();
  });
});

// ── Language ──────────────────────────────────────────────
/**
 * Public entry — called by lang buttons.
 * Updates text, meta, options, then re-renders only the
 * dynamic sections that belong to the current page.
 */
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("sdev_lang", lang);
  document.documentElement.lang = lang;

  // Text-only pass (data-i18n / data-i18n-ph attributes)
  _applyLangText(lang);
  _syncLangMeta(lang);
  _syncLangOptions(lang);

  // Re-render only what is on this page
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

/** Walks [data-i18n] and [data-i18n-ph] nodes and swaps text only. */
function _applyLangText(lang) {
  const t = I18N[lang];
  if (!t) return;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if (t[k] === undefined) return;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = t[k];
    } else {
      el.textContent = t[k];
    }
  });

  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const k = el.getAttribute("data-i18n-ph");
    if (t[k] !== undefined) el.placeholder = t[k];
  });
}

/** Updates header flag + code badge. */
function _syncLangMeta(lang) {
  const meta = LANG_META[lang];
  if (!meta) return;
  const hf = document.getElementById("headerFlag");
  const hc = document.getElementById("headerCode");
  if (hf) hf.textContent = meta.flag;
  if (hc) hc.textContent = meta.code;
}

/** Marks active option inside the language modal. */
function _syncLangOptions(lang) {
  document.querySelectorAll(".lang-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function openLangModal()  { document.getElementById("lang-overlay")?.classList.add("open"); }
function closeLangModal() { document.getElementById("lang-overlay")?.classList.remove("open"); }
function setLang(lang)    { applyLang(lang); setTimeout(closeLangModal, 250); }

// ── Nav active state ───────────────────────────────────────
function _syncNavActive() {
  const path = location.pathname.replace(/\/$/, "") || "/index.html";
  document.querySelectorAll(".nav-item, .bnav-item").forEach(el => {
    const href = el.getAttribute("href") || "";
    const match =
      (href.includes("index")    && (path === "/" || path.includes("index"))) ||
      (href.includes("projects") && path.includes("projects")) ||
      (href.includes("services") && path.includes("services")) ||
      (href.includes("contact")  && path.includes("contact"))  ||
      (href.includes("about")    && path.includes("about"));
    if (match) el.classList.add("active");
  });
}

// ── Filter buttons ─────────────────────────────────────────
function buildFilterButtons() {
  const wrap = document.getElementById("filterBtns");
  if (!wrap) return;
  wrap.innerHTML = "";
  const cats = ["all", ...Object.keys(CATEGORIES).filter(k => k !== "all")];
  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === activeFilter ? " active" : "");
    btn.dataset.cat = cat;
    btn.onclick = () => setFilter(cat);
    if (cat !== "all") {
      const c = CAT_COLORS[cat];
      btn.style.cssText = `--cat-text:${c.text};--cat-bg:${c.bg};--cat-border:${c.border}`;
    }
    btn.textContent = CATEGORIES[cat][currentLang] || cat;
    wrap.appendChild(btn);
  });
}

function updateFilterLabels() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    const cat = btn.dataset.cat;
    btn.textContent = CATEGORIES[cat]?.[currentLang] || cat;
  });
}

function setFilter(cat) {
  activeFilter = cat;
  document.querySelectorAll(".filter-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.cat === cat)
  );
  // On index page keep the limit; on projects page show all
  renderProjects(PAGE === "index" ? INDEX_PROJECTS_LIMIT : undefined);
}

// ── Project Render ─────────────────────────────────────────
/**
 * @param {number|undefined} limit  – pass a number to slice the list (index page).
 *                                    Omit / undefined = show all (projects page).
 */
function renderProjects(limit) {
  const grid  = document.getElementById("projectsGrid");
  const empty = document.getElementById("emptyState");
  if (!grid) return;

  let list = activeFilter === "all"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeFilter);

  if (typeof limit === "number") list = list.slice(0, limit);

  if (list.length === 0) {
    grid.innerHTML = "";
    if (empty) empty.style.display = "flex";
    return;
  }
  if (empty) empty.style.display = "none";

  grid.innerHTML = list.map(buildCard).join("");

  requestAnimationFrame(() => {
    grid.querySelectorAll(".proj-card").forEach((card, i) => {
      card.style.animationDelay = (i * 0.07) + "s";
      card.classList.add("reveal");
    });
  });
}

function buildCard(p) {
  const t        = I18N[currentLang];
  const c        = CAT_COLORS[p.category] || CAT_COLORS.web;
  const catLabel = CATEGORIES[p.category]?.[currentLang] || p.category;
  const title    = p.title[currentLang]   || p.title.ru;
  const desc     = p.desc[currentLang]    || p.desc.ru;
  const btnLabel = STATUS_LABELS[p.status]?.[currentLang] || t.liveBtn;
  const isLive   = p.status === "live" && p.url !== "#";

  const techTags = p.tech.map(tag =>
    `<span class="tech-tag" style="color:${c.text};background:${c.bg};border-color:${c.border}">${tag}</span>`
  ).join("");

  return `
  <div class="proj-card" style="--cat-glow:${c.glow};--cat-border:${c.border};--cat-text:${c.text};--cat-bg:${c.bg}">
    <div class="proj-img-wrap">
      <img class="proj-img" src="${p.image}" alt="${title}" loading="lazy">
      <div class="proj-img-overlay"></div>
      <span class="proj-cat-badge">${catLabel}</span>
      <span class="proj-year">${p.year}</span>
    </div>
    <div class="proj-body" style="padding:0 2px">
      <div class="proj-title">${title}</div>
      <div class="proj-desc">${desc}</div>
      <div class="proj-tech">
        <span class="proj-tech-label">${t.techLabel}</span>
        <div class="proj-tags">${techTags}</div>
      </div>
      ${isLive
        ? `<a class="proj-btn" href="${p.url}" target="_blank" rel="noopener">${ICON_EXTERNAL} ${btnLabel}</a>`
        : `<div class="proj-btn proj-btn-dim">${ICON_CLOCK} ${btnLabel}</div>`}
    </div>
    <div class="proj-glow-line" style="background:linear-gradient(90deg,transparent,${c.text},transparent)"></div>
  </div>`;
}

const ICON_EXTERNAL = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
const ICON_CLOCK    = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

// ── Services Render ────────────────────────────────────────
function renderServices() {
  const el = document.getElementById("servicesContent");
  if (!el) return;
  const t = I18N[currentLang];

  const svcs = [
    { icon: ICON_GLOBE,   titleKey: "svcWebTitle",    descKey: "svcWebDesc",    color: "#2aabee" },
    { icon: ICON_BRAIN,   titleKey: "svcAiTitle",     descKey: "svcAiDesc",     color: "#a78bfa" },
    { icon: ICON_PHONE,   titleKey: "svcMobTitle",    descKey: "svcMobDesc",    color: "#3DD28A" },
    { icon: ICON_ZAP,     titleKey: "svcAutoTitle",   descKey: "svcAutoDesc",   color: "#fbbf24" },
    { icon: ICON_BOT,     titleKey: "svcBotTitle",    descKey: "svcBotDesc",    color: "#D4AF37" },
    { icon: ICON_PALETTE, titleKey: "svcDesignTitle", descKey: "svcDesignDesc", color: "#f472b6" },
  ];

  el.innerHTML = `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px">
    ${svcs.map(s => `
    <div class="card service-card">
      <div class="card-glow-line"></div>
      <span class="corner corner-tl"></span><span class="corner corner-tr"></span>
      <span class="corner corner-bl"></span><span class="corner corner-br"></span>
      <div class="service-icon" style="background:rgba(0,0,0,.3);border:1px solid ${s.color}22">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px ${s.color}66)">${s.icon}</svg>
      </div>
      <div class="service-name">${t[s.titleKey]}</div>
      <div class="service-desc">${t[s.descKey]}</div>
      <div class="service-bottom-line" style="background:linear-gradient(90deg,transparent,${s.color}44,transparent)"></div>
    </div>`).join("")}
  </div>`;
}

// ── About Render ───────────────────────────────────────────
/**
 * Single entry point for About page re-render (language switch
 * or initial load). Handles:
 *   1. Static [data-i18n] / [data-i18n-ph] text nodes
 *   2. Delegates skill bars + reviews to about.html helpers
 *      via window.aboutPage (defined in the inline script there)
 */
function renderAbout() {
  const el = document.getElementById("aboutContent");
  if (!el) return;
  const t = I18N[currentLang];

  // 1. Static i18n text nodes
  el.querySelectorAll("[data-i18n]").forEach(node => {
    const k = node.getAttribute("data-i18n");
    if (t[k] !== undefined) node.textContent = t[k];
  });
  el.querySelectorAll("[data-i18n-ph]").forEach(node => {
    const k = node.getAttribute("data-i18n-ph");
    if (t[k] !== undefined) node.placeholder = t[k];
  });

  // feedbackTitle lives outside aboutContent, sync it here too
  const ft = document.getElementById("feedbackTitle");
  if (ft && t["feedbackTitle"]) ft.textContent = t["feedbackTitle"];

  // 2. Delegate dynamic sections to about.html page helpers
  const ap = window.aboutPage;
  if (ap) {
    ap.renderSkillBars(currentLang);
    ap.renderReviews(currentLang);
  }
}

// ── Contact Render ─────────────────────────────────────────
function renderContact() {
  const el = document.getElementById("contactContent");
  if (!el) return;
  const t = I18N[currentLang];

  el.querySelectorAll("[data-i18n]").forEach(node => {
    const k = node.getAttribute("data-i18n");
    if (t[k] !== undefined) node.textContent = t[k];
  });
  el.querySelectorAll("[data-i18n-ph]").forEach(node => {
    const k = node.getAttribute("data-i18n-ph");
    if (t[k] !== undefined) node.placeholder = t[k];
  });
}

// ── Clipboard helper ───────────────────────────────────────
/**
 * Copies text to clipboard.
 * Uses the modern Clipboard API with a graceful fallback
 * for older browsers / insecure contexts.
 *
 * @param {string}      text        – text to copy
 * @param {HTMLElement} [feedbackEl]– optional element whose textContent is
 *                                    temporarily changed to confirmMsg
 * @param {string}      [confirmMsg]– message shown on success (default "✓")
 */
function copyToClipboard(text, feedbackEl, confirmMsg = "✓") {
  const _flash = () => {
    if (!feedbackEl) return;
    const orig = feedbackEl.textContent;
    feedbackEl.textContent = confirmMsg;
    setTimeout(() => { feedbackEl.textContent = orig; }, 1500);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(_flash).catch(() => _legacyCopy(text, _flash));
  } else {
    _legacyCopy(text, _flash);
  }
}

function _legacyCopy(text, cb) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand("copy"); cb?.(); } catch (_) { /* silent */ }
  document.body.removeChild(ta);
}

// ── SVG icon snippets ──────────────────────────────────────
const ICON_GLOBE   = `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`;
const ICON_BRAIN   = `<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>`;
const ICON_PHONE   = `<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>`;
const ICON_ZAP     = `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>`;
const ICON_BOT     = `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`;
const ICON_PALETTE = `<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>`;
    
