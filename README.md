# 🚀 Soltero Dev — Modern Portfolio & PWA Web App

A high-performance, responsive and installable portfolio web application built with vanilla JavaScript, featuring PWA support, multilingual system, and modular architecture.

---

## 🌐 Live Demo
> Add your link here  
`https://your-domain.com`

---

## ✨ Key Features

### ⚡ Performance & UX
- Ultra lightweight vanilla JS architecture
- Optimized DOM rendering
- Smooth animations & modern UI

### 📱 PWA (Progressive Web App)
- Installable on mobile & desktop
- Smart install prompt (Android/Chrome)
- iOS Safari install guide fallback
- Service Worker caching + offline support
- Auto update detection system

### 🌍 Multi-language System
- Dynamic language switching
- Stored user preference (localStorage)
- Extensible i18n structure

### 🧩 Modular Architecture
- `app.js` → core logic
- `projects.js` → project data layer
- `pwa.js` → installation system
- `sw.js` → service worker caching
- `i18n.js` → language system

---

## 🛠️ Tech Stack

- HTML5 (semantic structure)
- CSS3 (custom UI + animations)
- Vanilla JavaScript (no frameworks)
- Service Worker API
- PWA API (beforeinstallprompt, cache)

---

## 📁 Project Structure
/index.html /app.js /projects.js /i18n.js /pwa.js /sw.js /assets/

---

## 📲 PWA Installation Flow

### Android / Chrome
- Automatic install prompt appears
- Custom install button in UI

### iOS (Safari)
- Manual install guide banner
- “Add to Home Screen” instructions

---

## 🔧 Configuration

### 🧠 Projects
Edit:
```js id="projects_js_hint"
projects.js
